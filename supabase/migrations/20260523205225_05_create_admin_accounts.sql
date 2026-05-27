-- ============================================================================
-- Migration 05 — admin_accounts (M02 — Authentification Admin)
-- ============================================================================
-- Crée la table admin_accounts pour le système d'auth custom :
--   username + PIN bcrypt + JWT cookie httpOnly (PAS Supabase Auth).
--
-- Inclut également la FK reportée depuis M00 :
--   app_config.updated_by -> admin_accounts(id)
--
-- Pré-requis :
--   - enum admin_role (01_create_enums.sql)
--   - fonction update_updated_at_column() (18_create_functions.sql)
--   - extension pgcrypto activée (gen_random_uuid)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table admin_accounts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username        text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  role            public.admin_role NOT NULL,

  -- Authentification
  pin_hash        text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,

  -- Statut
  is_active       boolean NOT NULL DEFAULT true,

  -- Audit
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,

  -- Contraintes
  CONSTRAINT admin_username_format CHECK (
    username ~ '^[a-z0-9_]{3,20}$'
  ),
  CONSTRAINT admin_display_name_not_empty CHECK (
    length(trim(display_name)) >= 2
  ),
  CONSTRAINT admin_failed_attempts_nonneg CHECK (
    failed_attempts >= 0
  )
);

COMMENT ON TABLE public.admin_accounts IS
  'Comptes back-office (SUPER_ADMIN, ADMIN, REFEREE). Auth custom (username + PIN bcrypt + JWT cookie), pas Supabase Auth.';

COMMENT ON COLUMN public.admin_accounts.pin_hash IS
  'Hash bcrypt du PIN (saltRounds=12). PIN à 6 chiffres côté client. Jamais en clair.';

COMMENT ON COLUMN public.admin_accounts.locked_until IS
  'Si non NULL et > now(), le compte est temporairement bloqué (rate-limit 5 tentatives / 15 min).';

COMMENT ON COLUMN public.admin_accounts.failed_attempts IS
  'Compteur de PIN erronés depuis le dernier login réussi. Reset à 0 après login OK.';

-- ----------------------------------------------------------------------------
-- 2. Index partiel sur username (uniquement pour comptes actifs)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_username
  ON public.admin_accounts (username)
  WHERE is_active;

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_admin_accounts_updated_at ON public.admin_accounts;

CREATE TRIGGER trg_admin_accounts_updated_at
  BEFORE UPDATE ON public.admin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. FK reportée depuis M00 : app_config.updated_by -> admin_accounts(id)
-- ----------------------------------------------------------------------------
-- La colonne app_config.updated_by existe déjà (créée en 02_create_app_config.sql)
-- mais sans FK. On la pose maintenant que admin_accounts existe.
-- Idempotent : check explicite avant ADD CONSTRAINT.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_config_updated_by_fkey'
      AND conrelid = 'public.app_config'::regclass
  ) THEN
    ALTER TABLE public.app_config
      ADD CONSTRAINT app_config_updated_by_fkey
      FOREIGN KEY (updated_by)
      REFERENCES public.admin_accounts(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. RLS bloquante par défaut (D5)
-- ----------------------------------------------------------------------------
-- ENABLE RLS sans aucune policy = deny all pour anon et authenticated.
-- Seul service_role (utilisé côté serveur dans /lib/auth/) peut lire/écrire.
-- service_role bypass RLS automatiquement dans Supabase.

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- Révocation explicite des droits SQL pour les rôles non-admin
REVOKE ALL ON public.admin_accounts FROM anon, authenticated;
GRANT  ALL ON public.admin_accounts TO service_role;

COMMIT;

-- ============================================================================
-- Vérifications post-migration (à exécuter séparément, hors transaction)
-- ============================================================================
-- SELECT count(*) FROM public.admin_accounts;                  -- doit valoir 0
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.app_config'::regclass;            -- doit lister app_config_updated_by_fkey
-- SELECT indexname FROM pg_indexes
--   WHERE tablename = 'admin_accounts';                        -- doit lister idx_admin_username
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.admin_accounts'::regclass
--     AND NOT tgisinternal;                                    -- doit lister trg_admin_accounts_updated_at