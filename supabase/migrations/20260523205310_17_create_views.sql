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

-- ============================================================================
-- BLOC À AJOUTER À LA FIN DE : supabase/migrations/20260523205310_17_create_views.sql
-- (et à exécuter SEUL dans le SQL Editor — ne pas re-exécuter le haut du fichier)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- [M14] public_bracket_view
-- Bracket public : PSEUDOS UNIQUEMENT (Règle 2), jamais de noms réels,
-- jamais de capacity (Règle 1), jamais d'identifiants joueurs (player_*_id
-- exclus — seuls pseudo + badge sont exposés).
--
-- Visible UNIQUEMENT si le tournoi a bracket_visibility = 'published'
-- (le filtre est dans la vue elle-même : défense en profondeur en plus de la
-- RLS posée sur matches en migration 09).
--
-- next_match_id / next_match_slot sont exposés (UUID de matchs, non sensibles)
-- pour permettre le rendu des connexions de l'arbre côté client.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public_bracket_view AS
SELECT
  m.id,
  m.tournament_id,
  m.round_number,
  m.match_number,
  m.bracket_position,
  pa.pseudo            AS player_a_pseudo,
  pb.pseudo            AS player_b_pseudo,
  m.player_a_badge,
  m.player_b_badge,
  m.score_a,
  m.score_b,
  m.status,
  m.wave_number,
  m.console_number,
  m.scheduled_time,
  CASE
    WHEN m.winner_id IS NULL THEN NULL
    WHEN m.winner_id = m.player_a_id THEN 'a'
    ELSE 'b'
  END                  AS winner_side,
  m.next_match_id,
  m.next_match_slot
FROM matches m
LEFT JOIN profiles pa ON pa.id = m.player_a_id
LEFT JOIN profiles pb ON pb.id = m.player_b_id
JOIN tournaments t    ON t.id = m.tournament_id
WHERE t.bracket_visibility = 'published'
  AND t.is_deleted = false;

COMMENT ON VIEW public_bracket_view IS
  'Bracket public (M14) : pseudos + badges uniquement, visible seulement si bracket_visibility = published. EXCLUT noms réels, capacity et identifiants joueurs.';

GRANT SELECT ON public_bracket_view TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vérifications post-migration
-- ---------------------------------------------------------------------------
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'public_bracket_view' ORDER BY ordinal_position;
--   -- ne doit contenir NI player_a_id NI player_b_id NI winner_id
-- SELECT count(*) FROM public_bracket_view;  -- 0 tant que rien n'est publié