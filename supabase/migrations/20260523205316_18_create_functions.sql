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



CREATE OR REPLACE FUNCTION public.assign_badge_number(p_registration_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id uuid;
  v_current_badge int;
  v_next_badge    int;
BEGIN
  -- 1. Récupérer le tournoi + badge actuel de l'inscription cible
  SELECT tournament_id, badge_number
    INTO v_tournament_id, v_current_badge
  FROM public.registrations
  WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscription % introuvable', p_registration_id;
  END IF;

  -- 2. Déjà un badge → ne rien faire (idempotent)
  IF v_current_badge IS NOT NULL THEN
    RETURN v_current_badge;
  END IF;

  -- 3. Verrou atomique par tournoi : sérialise les attributions concurrentes
  --    sur le même tournoi sans bloquer les autres tournois.
  PERFORM pg_advisory_xact_lock(hashtext(v_tournament_id::text));

  -- 4. Prochain numéro libre pour CE tournoi (étanchéité — Règle 12)
  SELECT COALESCE(MAX(badge_number), 0) + 1
    INTO v_next_badge
  FROM public.registrations
  WHERE tournament_id = v_tournament_id;

  -- 5. Écrire le badge
  UPDATE public.registrations
     SET badge_number = v_next_badge
   WHERE id = p_registration_id;

  RETURN v_next_badge;
END;
$$;

COMMENT ON FUNCTION public.assign_badge_number(uuid) IS
  'Attribue atomiquement le prochain badge_number libre du tournoi à une inscription (advisory lock par tournoi). Idempotent si déjà attribué. Appelé par le trigger assign_badge_on_confirm (M08).';

-- service_role uniquement (le trigger l'exécute en DEFINER ; pas d'appel direct client)
REVOKE ALL ON FUNCTION public.assign_badge_number(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_badge_number(uuid) TO service_role;

-- ============================================================================
-- Vérification
-- ============================================================================
-- SELECT proname FROM pg_proc WHERE proname = 'assign_badge_number';  -- 1 ligne