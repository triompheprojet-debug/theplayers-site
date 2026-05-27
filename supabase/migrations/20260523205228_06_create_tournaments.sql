=-- ============================================================================
-- Migration 06 — tournaments (M03 — Gestion Saisons & Tournois Admin)
-- ============================================================================
-- Table centrale du projet. Représente :
--   - Tournoi Hors Saison (season_id IS NULL, type='off_season')
--   - Tournoi de Saison  (season_id rempli, type='season')
--   - Grande Finale      (season_id rempli, type='grand_final')
--
-- Particularités :
--   - capacity en colonne DÉDIÉE (Règle 1 : confidentielle, RLS spécifique)
--   - config jsonb pour tout le reste (game, prizes, payment, etc.)
--   - winner_player_id / runner_up_player_id / third_player_id : uuid SANS FK
--     (FK posée en M06 lors de la création de profiles)
--
-- Pré-requis :
--   - enums tournament_type, tournament_status (01_create_enums.sql)
--   - extension pgcrypto activée (gen_random_uuid)
--   - seasons (03_create_seasons.sql)
--   - admin_accounts (05_create_admin_accounts.sql)
--   - fonction update_updated_at_column() (18_create_functions.sql)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table tournaments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournaments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name                    text NOT NULL,
  tournament_type         public.tournament_type NOT NULL,
  season_id               uuid REFERENCES public.seasons(id) ON DELETE RESTRICT,
  tournament_number       int,

  -- Dates
  start_date              date NOT NULL,
  end_date                date NOT NULL,
  registration_opens_at   timestamptz,
  registration_closes_at  timestamptz,

  -- Statut et visibilité
  status                  public.tournament_status NOT NULL DEFAULT 'draft',
  is_registrations_open   boolean NOT NULL DEFAULT false,
  bracket_visibility      text    NOT NULL DEFAULT 'draft',

  -- Configuration (toutes les valeurs modifiables, structure validée par Zod côté code)
  config                  jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Champ confidentiel (capacité, Règle 1)
  capacity                int NOT NULL,

  -- Résultats finaux (alimentés à la fin du tournoi)
  -- FK vers profiles à poser en M06 (profiles n'existe pas encore)
  winner_player_id        uuid,
  runner_up_player_id     uuid,
  third_player_id         uuid,

  -- Audit
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  updated_by              uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  is_deleted              boolean NOT NULL DEFAULT false,

  -- Contraintes métier
  CONSTRAINT tournaments_dates_check
    CHECK (end_date >= start_date),

  CONSTRAINT tournaments_capacity_positive
    CHECK (capacity > 0),

  CONSTRAINT tournaments_name_not_empty
    CHECK (length(trim(name)) >= 2),

  CONSTRAINT tournaments_bracket_visibility_values
    CHECK (bracket_visibility IN ('draft', 'published')),

  CONSTRAINT tournaments_registration_window_check
    CHECK (
      registration_opens_at IS NULL
      OR registration_closes_at IS NULL
      OR registration_closes_at >= registration_opens_at
    ),

  -- Étanchéité type ↔ season_id (cohérence hiérarchie projet)
  CONSTRAINT tournaments_season_consistency CHECK (
    (tournament_type = 'off_season' AND season_id IS NULL)
    OR
    (tournament_type IN ('season', 'grand_final') AND season_id IS NOT NULL)
  ),

  -- Une Grande Finale unique par saison
  CONSTRAINT tournaments_grand_final_number_null CHECK (
    tournament_type <> 'grand_final' OR tournament_number IS NULL
  )
);

-- Contrainte d'unicité partielle : une seule Grande Finale par saison
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tournament_grand_final_per_season
  ON public.tournaments (season_id)
  WHERE tournament_type = 'grand_final' AND NOT is_deleted;

-- Contrainte d'unicité partielle : un tournament_number unique par saison
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tournament_number_per_season
  ON public.tournaments (season_id, tournament_number)
  WHERE tournament_type = 'season' AND tournament_number IS NOT NULL AND NOT is_deleted;

COMMENT ON TABLE public.tournaments IS
  'Table centrale des tournois. Type = off_season / season / grand_final. Étanchéité par tournoi (Règle 12).';

COMMENT ON COLUMN public.tournaments.capacity IS
  'Capacité confidentielle (Règle 1). Jamais exposée publiquement. Colonne dédiée pour permettre RLS spécifique.';

COMMENT ON COLUMN public.tournaments.config IS
  'Configuration jsonb du tournoi : game, match, rules, registration, prizes, consoles, schedule, payment, location. Structure validée par Zod côté code (tournamentConfigSchema). Le sous-objet payment.* est confidentiel.';

COMMENT ON COLUMN public.tournaments.is_registrations_open IS
  'Interrupteur manuel admin (M04). Indépendant de registration_opens_at/closes_at (qui peuvent être automatisés via pg_cron en M18).';

COMMENT ON COLUMN public.tournaments.bracket_visibility IS
  'draft = visible admin/référé seulement ; published = visible publiquement.';

COMMENT ON COLUMN public.tournaments.winner_player_id IS
  'uuid de profiles.id. FK ajoutée en M06 (lors de la création de profiles).';

-- ----------------------------------------------------------------------------
-- 2. Index
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tournaments_status
  ON public.tournaments (status)
  WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_tournaments_season
  ON public.tournaments (season_id)
  WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_tournaments_type
  ON public.tournaments (tournament_type);

CREATE INDEX IF NOT EXISTS idx_tournaments_dates
  ON public.tournaments (start_date DESC)
  WHERE NOT is_deleted;

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_tournaments_updated_at ON public.tournaments;

CREATE TRIGGER trg_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. RLS (policies détaillées dans 20_create_rls_policies.sql)
-- ----------------------------------------------------------------------------
-- Lecture publique INTERDITE sur la table directement (capacity confidentielle).
-- Le public passe par public_tournament_view (créée en 17_create_views.sql).
-- Admin/SUPER_ADMIN : via service_role (auth admin custom M02).

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.tournaments FROM anon, authenticated;
GRANT  ALL ON public.tournaments TO service_role;

COMMIT;

-- ============================================================================
-- Vérifications post-migration (à exécuter séparément)
-- ============================================================================
-- SELECT count(*) FROM public.tournaments;                            -- doit valoir 0
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.tournaments'::regclass;                  -- 7 CHECK + 3 FK + PK
-- SELECT indexname FROM pg_indexes WHERE tablename = 'tournaments';   -- PK + 4 simples + 2 uniques partiels
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.tournaments'::regclass
--     AND NOT tgisinternal;                                           -- trg_tournaments_updated_at