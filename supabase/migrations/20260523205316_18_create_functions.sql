-- ============================================================================
-- Migration 18 : Fonctions PostgreSQL
-- Module : M00 - Fondations (étendue progressivement)
-- Dépend de : 02_create_app_config.sql, 03_create_seasons.sql, 06_create_tournaments.sql
--
-- ⚠️ Cette migration est étendue à chaque module :
--    - M00 : update_updated_at_column, get_app_config
--    - M03 : get_active_tournament
--    - M08 : assign_badge_number, compute_points_earned (à venir)
--    - M14 : advance_winner_in_bracket (à venir)
--    - M16 : refresh_season_standings (à venir)
--
-- Toutes les définitions utilisent CREATE OR REPLACE → idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- [M00] update_updated_at_column()
-- Trigger générique pour maintenir la colonne updated_at à jour.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column() IS
  'Trigger générique : met à jour updated_at = now() avant chaque UPDATE.';

-- Attacher le trigger à app_config dès maintenant
DROP TRIGGER IF EXISTS trg_app_config_updated_at ON app_config;
CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- [M00] get_app_config(p_key text)
-- Lit une valeur de configuration de façon typée, en respectant is_secret.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_app_config(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value jsonb;
  v_is_secret boolean;
BEGIN
  SELECT value, is_secret
    INTO v_value, v_is_secret
  FROM app_config
  WHERE key = p_key;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Clé secrète : accessible uniquement via service_role
  IF v_is_secret AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RETURN NULL;
  END IF;

  RETURN v_value;
END;
$$;

COMMENT ON FUNCTION get_app_config(text) IS
  'Lecture typée d''app_config. Retourne NULL si clé inexistante OU clé secrète sans privilège service_role.';

GRANT EXECUTE ON FUNCTION get_app_config(text) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- [M03] get_active_tournament()
-- Retourne le tournoi actif (lu depuis app_config.active_tournament_id).
-- - NULL si aucun tournoi actif
-- - NULL si l'UUID stocké pointe vers un tournoi inexistant ou soft-deleted
-- - Sortie : capacity et payment.* exclus (sécurité défense en profondeur)
--
-- Cette fonction est appelée par anon/authenticated pour les pages publiques.
-- Pour l'admin (qui a besoin de capacity), passer par la table directement
-- via service_role + un client Supabase server.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_active_tournament()
RETURNS TABLE (
  id                     uuid,
  name                   text,
  tournament_type        tournament_type,
  season_id              uuid,
  tournament_number      int,
  start_date             date,
  end_date               date,
  registration_opens_at  timestamptz,
  registration_closes_at timestamptz,
  status                 tournament_status,
  is_registrations_open  boolean,
  bracket_visibility     text,
  game_info              jsonb,
  prizes                 jsonb,
  registration_info      jsonb,
  schedule_info          jsonb,
  location_info          jsonb,
  consoles_info          jsonb,
  match_info             jsonb,
  rules_info             jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_active_id uuid;
BEGIN
  -- 1. Lire l'uuid depuis app_config (la valeur stockée est un jsonb null ou un uuid quoté)
  SELECT (value #>> '{}')::uuid
    INTO v_active_id
  FROM app_config
  WHERE key = 'active_tournament_id' AND value <> 'null'::jsonb;

  IF v_active_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. Renvoyer les colonnes publiques uniquement (PAS capacity, PAS config.payment)
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.tournament_type,
    t.season_id,
    t.tournament_number,
    t.start_date,
    t.end_date,
    t.registration_opens_at,
    t.registration_closes_at,
    t.status,
    t.is_registrations_open,
    t.bracket_visibility,
    t.config -> 'game'         AS game_info,
    t.config -> 'prizes'       AS prizes,
    t.config -> 'registration' AS registration_info,
    t.config -> 'schedule'     AS schedule_info,
    t.config -> 'location'     AS location_info,
    t.config -> 'consoles'     AS consoles_info,
    t.config -> 'match'        AS match_info,
    t.config -> 'rules'        AS rules_info
  FROM tournaments t
  WHERE t.id = v_active_id
    AND NOT t.is_deleted;
END;
$$;

COMMENT ON FUNCTION get_active_tournament() IS
  'Retourne le tournoi actif lu depuis app_config.active_tournament_id, EXCLUSION faite de capacity et payment.* (Règles 1 et 8). Une seule ligne ou aucune.';

GRANT EXECUTE ON FUNCTION get_active_tournament() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Vérifications post-migration
-- ---------------------------------------------------------------------------
-- Test 1 : aucune fiche active
-- UPDATE app_config SET value = 'null'::jsonb WHERE key = 'active_tournament_id';
-- SELECT * FROM get_active_tournament();
-- → 0 ligne
--
-- Test 2 : fiche active (après création d'un tournoi T1)
-- UPDATE app_config SET value = to_jsonb('<uuid-T1>'::text) WHERE key = 'active_tournament_id';
-- SELECT id, name, game_info FROM get_active_tournament();
-- → 1 ligne, capacity ABSENT
--
-- Test 3 : id pointant vers tournoi soft-deleted
-- UPDATE tournaments SET is_deleted = true WHERE id = '<uuid-T1>';
-- SELECT * FROM get_active_tournament();
-- → 0 ligne