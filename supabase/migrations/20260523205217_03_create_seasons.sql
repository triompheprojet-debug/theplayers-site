-- ============================================================================
-- Migration 03 — seasons (M03 — Gestion Saisons & Tournois Admin)
-- ============================================================================
-- Crée la table seasons : conteneur de classement et de tournois de saison.
-- Une saison agrège N tournois (type='season') + une Grande Finale.
--
-- Pré-requis :
--   - extension pgcrypto activée (gen_random_uuid)
--   - admin_accounts (05_create_admin_accounts.sql) pour FK audit fields
--   - fonction update_updated_at_column() (18_create_functions.sql)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table seasons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasons (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name                     text NOT NULL,
  season_number            int  NOT NULL UNIQUE,
  description              text,

  -- Dates et planning
  start_date               date NOT NULL,
  end_date                 date NOT NULL,
  expected_tournaments     int  NOT NULL DEFAULT 12,

  -- Configuration de saison
  qualification_threshold  int  NOT NULL,   -- points min pour la Grande Finale (Règle 5)

  -- Statut (text + CHECK, pas un enum dédié)
  status                   text NOT NULL DEFAULT 'active',

  -- Audit
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  created_by               uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  updated_by               uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  is_deleted               boolean NOT NULL DEFAULT false,

  -- Contraintes métier
  CONSTRAINT seasons_dates_check
    CHECK (end_date >= start_date),
  CONSTRAINT seasons_threshold_positive
    CHECK (qualification_threshold > 0),
  CONSTRAINT seasons_expected_tournaments_positive
    CHECK (expected_tournaments > 0),
  CONSTRAINT seasons_name_not_empty
    CHECK (length(trim(name)) >= 2),
  CONSTRAINT seasons_season_number_positive
    CHECK (season_number > 0),
  CONSTRAINT seasons_status_values
    CHECK (status IN ('active', 'completed', 'archived'))
);

COMMENT ON TABLE public.seasons IS
  'Saisons de la Liga Esport FC. Conteneur de classement + tournois enfants (type=season) + Grande Finale.';

COMMENT ON COLUMN public.seasons.qualification_threshold IS
  'Points minimum à atteindre dans la saison pour être qualifié pour la Grande Finale (Règle 5).';

COMMENT ON COLUMN public.seasons.status IS
  'Cycle de vie : active (en cours) → completed (tous les tournois terminés) → archived.';

COMMENT ON COLUMN public.seasons.is_deleted IS
  'Soft delete. Les saisons ne sont jamais supprimées physiquement (audit trail).';

-- ----------------------------------------------------------------------------
-- 2. Index
-- ----------------------------------------------------------------------------
-- Lookup par statut (filtré sur les non-supprimées)
CREATE INDEX IF NOT EXISTS idx_seasons_status
  ON public.seasons (status)
  WHERE NOT is_deleted;

-- Lookup par numéro de saison (déjà UNIQUE mais utile en jointure)
CREATE INDEX IF NOT EXISTS idx_seasons_number
  ON public.seasons (season_number);

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_seasons_updated_at ON public.seasons;

CREATE TRIGGER trg_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. RLS (policies détaillées dans 20_create_rls_policies.sql)
-- ----------------------------------------------------------------------------
-- Données NON confidentielles : la liste des saisons est visible publiquement.
-- Mais on ENABLE quand même pour appliquer les filtres (is_deleted).

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.seasons FROM anon, authenticated;
GRANT  SELECT ON public.seasons TO anon, authenticated;
GRANT  ALL    ON public.seasons TO service_role;

COMMIT;

-- ============================================================================
-- Vérifications post-migration (à exécuter séparément)
-- ============================================================================
-- SELECT count(*) FROM public.seasons;                            -- doit valoir 0
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.seasons'::regclass;                  -- 7 contraintes CHECK + 2 FK + PK + UNIQUE
-- SELECT indexname FROM pg_indexes WHERE tablename = 'seasons';   -- 3 index (PK + 2 personnalisés)
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.seasons'::regclass
--     AND NOT tgisinternal;                                       -- doit lister trg_seasons_updated_at