-- ============================================================================
-- Migration 07 — registrations (M08 — Inscription au tournoi)
-- ============================================================================
-- Une inscription lie un joueur (profiles) à un tournoi (tournaments).
-- Cycle de vie (enum registration_status) :
--   reserved              → place réservée (badge NON attribué)
--   awaiting_verification → preuve de paiement soumise (M09)
--   confirmed             → paiement validé par admin → badge attribué (trigger M08)
--   rejected              → paiement refusé
--   cancelled             → annulée
--
-- Règles métier appliquées ici :
--   - Règle 12 (étanchéité) : tout est lié à tournament_id.
--       Unicité (tournament_id, player_id) → un joueur ne s'inscrit qu'une
--       fois par tournoi.
--   - Badge à la CONFIRMATION, pas à la réservation : badge_number reste NULL
--       tant que status <> 'confirmed'. Unicité (tournament_id, badge_number).
--   - Règle 9 (zéro remboursement) : aucune colonne refund.
--
-- Pré-requis (déjà en place en prod) :
--   - tournaments (06), profiles (04)
--   - enum registration_status (01_create_enums)
--   - fonction update_updated_at_column() (18)
--
-- Idempotent : CREATE TABLE IF NOT EXISTS, DROP TRIGGER/POLICY IF EXISTS.
-- À coller tel quel dans le SQL Editor (Supabase Cloud).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table registrations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Étanchéité par tournoi (Règle 12)
  tournament_id   uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id       uuid NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,

  -- Cycle de vie
  status          registration_status NOT NULL DEFAULT 'reserved',

  -- Badge : attribué SEULEMENT à la confirmation (trigger assign_badge_on_confirm)
  badge_number    int,

  -- Origine de l'inscription
  registered_at   timestamptz NOT NULL DEFAULT now(),
  registered_via  text NOT NULL DEFAULT 'online',   -- 'online' (joueur) | 'manual' (admin)
  registered_by_admin uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,

  -- Résultats (alimentés en fin de tournoi, modules ultérieurs)
  final_position  int,
  final_round     text,
  points_earned   int NOT NULL DEFAULT 0,

  -- Divers
  notes           text,

  -- Timestamps de transition d'état
  confirmed_at    timestamptz,
  rejected_at     timestamptz,
  cancelled_at    timestamptz,

  -- Audit
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Contraintes métier
  CONSTRAINT registrations_unique_per_tournament
    UNIQUE (tournament_id, player_id),
  CONSTRAINT registrations_unique_badge
    UNIQUE (tournament_id, badge_number),
  CONSTRAINT registrations_badge_positive
    CHECK (badge_number IS NULL OR badge_number > 0),
  CONSTRAINT registrations_registered_via_valid
    CHECK (registered_via IN ('online', 'manual')),
  CONSTRAINT registrations_points_nonneg
    CHECK (points_earned >= 0)
);

COMMENT ON TABLE public.registrations IS
  'Inscriptions joueur ↔ tournoi (Règle 12). Badge attribué uniquement à la confirmation. Aucun remboursement (Règle 9).';

COMMENT ON COLUMN public.registrations.badge_number IS
  'Numéro de badge dans le tournoi. NULL tant que status <> confirmed. Attribué atomiquement par assign_badge_number() via le trigger assign_badge_on_confirm.';

COMMENT ON COLUMN public.registrations.registered_via IS
  'Origine : online (réservation par le joueur) ou manual (saisie admin, M-ultérieur).';

-- ----------------------------------------------------------------------------
-- 2. Index
-- ----------------------------------------------------------------------------
-- Note : les UNIQUE ci-dessus créent déjà des index sur (tournament_id, player_id)
-- et (tournament_id, badge_number). On ajoute les index de lecture courants.
CREATE INDEX IF NOT EXISTS idx_registrations_player
  ON public.registrations (player_id);

CREATE INDEX IF NOT EXISTS idx_registrations_tournament_status
  ON public.registrations (tournament_id, status);

CREATE INDEX IF NOT EXISTS idx_registrations_status
  ON public.registrations (status);

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_registrations_updated_at ON public.registrations;
CREATE TRIGGER trg_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------------------
-- Joueur : lit/insère UNIQUEMENT ses propres inscriptions.
--   - SELECT : player_id = auth.uid()
--   - INSERT : player_id = auth.uid() ET status forcé 'reserved' ET badge NULL
--              (la Server Action écrit en service_role, mais on verrouille
--               aussi la voie authenticated par défense en profondeur).
--   - UPDATE/DELETE : aucune policy → interdit au joueur. Transitions d'état et
--     annulations passent par service_role (admin / Server Actions contrôlées).
-- Admin custom : service_role (bypass RLS).

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.registrations FROM anon, authenticated;
GRANT  SELECT, INSERT ON public.registrations TO authenticated;
GRANT  ALL ON public.registrations TO service_role;

DROP POLICY IF EXISTS registrations_select_own ON public.registrations;
CREATE POLICY registrations_select_own
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

DROP POLICY IF EXISTS registrations_insert_own ON public.registrations;
CREATE POLICY registrations_insert_own
  ON public.registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND status = 'reserved'
    AND badge_number IS NULL
  );

COMMIT;

-- ============================================================================
-- Vérifications post-migration (exécuter séparément)
-- ============================================================================
-- SELECT count(*) FROM public.registrations;                 -- 0
--
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.registrations'::regclass;
--   -- PK + unique_per_tournament + unique_badge + badge_positive
--   --    + registered_via_valid + points_nonneg + 3 FK
--
-- SELECT indexname FROM pg_indexes WHERE tablename = 'registrations';
--   -- PK + 2 unique + idx_registrations_player
--   --    + idx_registrations_tournament_status + idx_registrations_status
--
-- SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname='public' AND tablename='registrations';
--   -- registrations_select_own (SELECT) + registrations_insert_own (INSERT)