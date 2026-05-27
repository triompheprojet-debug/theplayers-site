-- ============================================================================
-- Migration 20 (partielle - M03) : Row Level Security Policies
-- Module : M03 - Gestion Saisons & Tournois Admin
-- Dépend de : 02 (app_config), 03 (seasons), 06 (tournaments), 15 (activity_log)
--
-- ⚠️ Cette migration est étendue à chaque module qui crée une table.
-- ⚠️ Ne PAS dropper de policies déjà créées : ce fichier est append-only.
--
-- Principe général du projet :
--   - service_role bypass RLS (utilisé par Server Actions admin)
--   - anon = visiteur non connecté (pages publiques)
--   - authenticated = joueur connecté via Supabase Auth (à venir M06)
--   - admin custom = n'utilise PAS authenticated, passe par service_role
--
-- Tous les CREATE POLICY utilisent `IF NOT EXISTS` (PostgreSQL 16+) pour
-- l'idempotence. Compatible Supabase Cloud (PG 15+ ne supporte pas
-- IF NOT EXISTS sur CREATE POLICY → on utilise DROP POLICY IF EXISTS + CREATE).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. app_config (étendu depuis M00)
-- ============================================================================

-- Lecture publique : passe par public_app_config_view (déjà granted)
-- Lecture directe interdite à anon/authenticated (qr_signing_key etc.)
-- service_role bypass automatique.

-- Pas de policy SELECT/INSERT/UPDATE/DELETE pour anon/authenticated.
-- RLS ENABLE + REVOKE déjà fait en 02_create_app_config.sql.

-- Note : si un jour on veut lire app_config en client public, on passe par la vue.

-- ============================================================================
-- 2. seasons (créé en M03)
-- ============================================================================

-- Lecture publique : tout le monde peut lister les saisons non-supprimées.
-- Les saisons elles-mêmes ne contiennent rien de confidentiel.

DROP POLICY IF EXISTS seasons_select_public ON public.seasons;
CREATE POLICY seasons_select_public
  ON public.seasons
  FOR SELECT
  TO anon, authenticated
  USING (NOT is_deleted);

-- Écritures : interdites à anon/authenticated.
-- L'admin custom écrit via service_role (bypass RLS).

-- ============================================================================
-- 3. tournaments (créé en M03)
-- ============================================================================

-- Lecture directe INTERDITE à anon/authenticated (Règle 1 : capacity confidentielle).
-- Le public passe par public_tournament_view (créée en 17_create_views.sql).
-- L'admin lit la table directement via service_role.

-- Aucune policy ouverte. RLS ENABLE + REVOKE déjà fait en 06.

-- ============================================================================
-- 4. activity_log (créé en M03)
-- ============================================================================

-- Lecture/écriture interdites à anon/authenticated.
-- Seul service_role écrit (depuis lib/activity/log.ts) et lit (page admin M10).

-- Aucune policy ouverte. RLS ENABLE + REVOKE déjà fait en 15.

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
-- Liste des policies actives :
-- SELECT schemaname, tablename, policyname, cmd, roles
--   FROM pg_policies
--  WHERE schemaname = 'public'
--  ORDER BY tablename, policyname;
--
-- Doit retourner au moins :
--   - seasons / seasons_select_public / SELECT / {anon,authenticated}
--
-- Tables avec RLS activée :
-- SELECT relname, relrowsecurity
--   FROM pg_class
--  WHERE relkind = 'r'
--    AND relnamespace = 'public'::regnamespace
--    AND relname IN ('app_config', 'seasons', 'tournaments', 'activity_log', 'admin_accounts')
--  ORDER BY relname;
--
-- Toutes doivent avoir relrowsecurity = true.
--
-- Test d'isolation (depuis le client public) :
-- SELECT count(*) FROM tournaments;        -- doit échouer ou retourner 0
-- SELECT count(*) FROM public_tournament_view;  -- doit fonctionner
-- SELECT count(*) FROM activity_log;       -- doit échouer ou retourner 0