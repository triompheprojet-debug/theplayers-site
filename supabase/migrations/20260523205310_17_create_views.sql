-- ============================================================================
-- Migration 17 : Vues SQL
-- Module : M00 - Fondations (étendue progressivement)
-- Dépend de : 02_create_app_config.sql, 06_create_tournaments.sql
--
-- ⚠️ Cette migration est étendue à chaque module :
--    - M00 : public_app_config_view
--    - M03 : public_tournament_view
--    - M14 : public_bracket_view (à venir)
--    - M16 : season_leaderboard_view (à venir)
--
-- Toutes les définitions utilisent CREATE OR REPLACE → idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- [M00] public_app_config_view
-- Expose uniquement les clés non-secrètes de app_config au client public.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public_app_config_view AS
SELECT
  key,
  value,
  description,
  updated_at
FROM app_config
WHERE is_secret = false;

COMMENT ON VIEW public_app_config_view IS
  'Configuration publique du site : exclut les clés is_secret = true (qr_encryption_key, qr_signing_key).';

GRANT SELECT ON public_app_config_view TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- [M03] public_tournament_view
-- Expose les tournois non-supprimés sans données confidentielles.
--
-- EXCLUSIONS :
--   - capacity (colonne, Règle 1)
--   - config.payment.* (numéros MTN/Airtel, holders, Règle 8)
--   - winner/runner_up/third_player_id ne sont PAS exclus (publics quand
--     tournoi completed). Les FK vers profiles seront ajoutées en M06.
--
-- Utilisation : pages publiques (M05+), espaces joueur/arbitre.
-- L'admin et le SUPER_ADMIN lisent la table directement via service_role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public_tournament_view AS
SELECT
  id,
  name,
  tournament_type,
  season_id,
  tournament_number,
  start_date,
  end_date,
  registration_opens_at,
  registration_closes_at,
  status,
  is_registrations_open,
  bracket_visibility,
  -- Sous-objets de config explicitement listés (jamais config.payment)
  config -> 'game'         AS game_info,
  config -> 'match'        AS match_info,
  config -> 'rules'        AS rules_info,
  config -> 'registration' AS registration_info,
  config -> 'prizes'       AS prizes,
  config -> 'consoles'     AS consoles_info,
  config -> 'schedule'     AS schedule_info,
  config -> 'location'     AS location_info,
  -- Résultats (NULL tant que tournoi non terminé)
  winner_player_id,
  runner_up_player_id,
  third_player_id,
  created_at,
  updated_at
FROM tournaments
WHERE is_deleted = false;

COMMENT ON VIEW public_tournament_view IS
  'Vue publique des tournois non-supprimés. EXCLUT capacity (Règle 1) et config.payment.* (Règle 8).';

GRANT SELECT ON public_tournament_view TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vérifications post-migration
-- ---------------------------------------------------------------------------
-- SELECT key FROM public_app_config_view ORDER BY key;
-- → ne doit pas contenir qr_encryption_key, qr_signing_key
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'public_tournament_view' ORDER BY ordinal_position;
-- → ne doit PAS contenir 'capacity' ni 'config'