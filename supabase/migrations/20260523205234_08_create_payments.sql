-- ============================================================================
-- Migration 08 — payments (M09 — Paiement joueur)
-- ============================================================================
-- Une preuve de paiement soumise par le joueur pour SA réservation.
-- Vérification MANUELLE par l'admin (M10).
--
-- Cycle de vie (enum payment_status) :
--   pending    → preuve soumise, en attente de vérification admin
--   confirmed  → validée → l'inscription liée passe à 'confirmed' (côté code/admin)
--   rejected   → refusée (rejection_reason renseignée)
--
-- Règles métier appliquées ici :
--   - Règle 3 (terminologie) : enum payment_method = mtn_mobile_money | airtel_money | cash.
--       cash NE PORTE PAS de transaction_ref (contrainte payments_cash_no_ref).
--   - Règle 9 (zéro remboursement) : aucune colonne refund + trigger
--       prevent_refund_columns (défense en profondeur si un ALTER futur en ajoute).
--   - Anti double-soumission : (method, transaction_ref) unique (DEFERRABLE).
--   - Règle 12 (étanchéité) : registration_id + tournament_id + player_id (dénormalisés).
--
-- Pré-requis (déjà en prod) :
--   - registrations (07), tournaments (06), profiles (04), admin_accounts (05)
--   - enums payment_method, payment_status (01_create_enums)
--   - fonction update_updated_at_column() (18)
--
-- Idempotent. À coller tel quel dans le SQL Editor (Supabase Cloud).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table payments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Étanchéité (Règle 12) — dénormalisation tournament_id/player_id pour RLS
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  tournament_id   uuid NOT NULL REFERENCES public.tournaments(id)   ON DELETE CASCADE,
  player_id       uuid NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,

  -- Détails du paiement
  method          payment_method NOT NULL,
  amount_fcfa     int NOT NULL,
  sender_phone    text,                 -- numéro émetteur (mobile money), normalisé +242
  sender_name     text,                 -- nom du titulaire émetteur (facultatif)
  time_slot       text,                 -- créneau déclaré du dépôt (ex : "12-13h")
  transaction_ref text,                 -- réf opérateur ; NULL pour cash

  -- Preuve (capture) dans le bucket privé payment-proofs
  proof_file_url  text,                 -- chemin objet : {player_id}/{registration_id}/{uuid}.ext
  submitted_at    timestamptz NOT NULL DEFAULT now(),

  -- Vérification admin (M10)
  status          payment_status NOT NULL DEFAULT 'pending',
  verified_at     timestamptz,
  verified_by     uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  rejection_reason text,
  internal_note   text,

  -- Audit
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Contraintes métier
  CONSTRAINT payments_amount_positive
    CHECK (amount_fcfa > 0),
  -- cash : pas de référence de transaction (Règle 3)
  CONSTRAINT payments_cash_no_ref
    CHECK (
      (method = 'cash' AND transaction_ref IS NULL)
      OR (method <> 'cash')
    ),
  -- non-cash : référence obligatoire
  CONSTRAINT payments_noncash_ref_required
    CHECK (
      (method = 'cash')
      OR (method <> 'cash' AND transaction_ref IS NOT NULL AND length(trim(transaction_ref)) > 0)
    )
);

-- Anti double-soumission : une même référence ne peut servir deux fois pour
-- une même méthode. DEFERRABLE → vérifié en fin de transaction (souple pour
-- d'éventuelles corrections admin dans une même transaction).
-- NULLS NOT DISTINCT non requis : cash a transaction_ref NULL (autorisé multiple).
DROP INDEX IF EXISTS payments_unique_ref;
CREATE UNIQUE INDEX payments_unique_ref
  ON public.payments (method, transaction_ref)
  WHERE transaction_ref IS NOT NULL;

COMMENT ON TABLE public.payments IS
  'Preuves de paiement joueur (vérif manuelle admin). MTN/Airtel/cash (Règle 3). Aucun remboursement (Règle 9). Étanche par tournoi (Règle 12).';
COMMENT ON COLUMN public.payments.transaction_ref IS
  'Référence opérateur. NULL pour cash. Unique par (method, transaction_ref) — anti double-soumission.';
COMMENT ON COLUMN public.payments.proof_file_url IS
  'Chemin objet dans le bucket PRIVÉ payment-proofs : {player_id}/{registration_id}/{uuid}.ext. Lu via URL signée (admin).';

-- ----------------------------------------------------------------------------
-- 2. Index
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payments_registration
  ON public.payments (registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_player
  ON public.payments (player_id);
CREATE INDEX IF NOT EXISTS idx_payments_tournament_status
  ON public.payments (tournament_id, status);

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. Trigger prevent_refund_columns (Règle 9 — défense en profondeur)
-- ----------------------------------------------------------------------------
-- Bloque toute tentative d'écriture sur une éventuelle colonne refund_* qui
-- serait ajoutée par erreur dans le futur. La table n'en a aucune aujourd'hui ;
-- le trigger échoue de façon explicite si une telle colonne apparaît et reçoit
-- une valeur non nulle. On reste générique sans référencer de colonne inexistante.
CREATE OR REPLACE FUNCTION public.prevent_refund_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_col text;
BEGIN
  -- Détecte dynamiquement toute colonne dont le nom contient 'refund'
  FOR v_col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name ILIKE '%refund%'
  LOOP
    RAISE EXCEPTION
      'Règle 9 (zéro remboursement) : la colonne "%" est interdite sur payments.', v_col;
  END LOOP;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_refund_columns() IS
  'Règle 9 : empêche l''introduction de toute colonne refund_* sur payments. Lève une exception si une telle colonne existe.';

DROP TRIGGER IF EXISTS trg_payments_prevent_refund ON public.payments;
CREATE TRIGGER trg_payments_prevent_refund
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_refund_columns();

-- ----------------------------------------------------------------------------
-- 5. RLS
-- ----------------------------------------------------------------------------
-- Joueur : lit/insère UNIQUEMENT ses propres paiements.
--   - SELECT : player_id = auth.uid()
--   - INSERT : player_id = auth.uid() ET status forcé 'pending'
--   - UPDATE/DELETE : interdits au joueur (vérification = service_role/admin)
-- Admin custom : service_role (bypass RLS).

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.payments FROM anon, authenticated;
GRANT  SELECT, INSERT ON public.payments TO authenticated;
GRANT  ALL ON public.payments TO service_role;

DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

DROP POLICY IF EXISTS payments_insert_own ON public.payments;
CREATE POLICY payments_insert_own
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND status = 'pending'
  );

COMMIT;

-- ============================================================================
-- Vérifications post-migration (exécuter séparément)
-- ============================================================================
-- SELECT count(*) FROM public.payments;                         -- 0
--
-- SELECT conname FROM pg_constraint WHERE conrelid='public.payments'::regclass;
--   -- PK + amount_positive + cash_no_ref + noncash_ref_required + 4 FK
--
-- SELECT indexname FROM pg_indexes WHERE tablename='payments';
--   -- PK + payments_unique_ref + idx_payments_registration
--   --    + idx_payments_player + idx_payments_tournament_status
--
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid='public.payments'::regclass AND NOT tgisinternal;
--   -- trg_payments_updated_at + trg_payments_prevent_refund
--
-- SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname='public' AND tablename='payments';
--   -- payments_select_own (SELECT) + payments_insert_own (INSERT)