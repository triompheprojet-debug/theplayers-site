-- ============================================================================
-- Migration 18 (partielle - M00) : Fonctions PostgreSQL
-- Module : M00 - Fondations
-- Dépend de : 02_create_app_config.sql
--
-- ⚠️ Cette migration sera étendue dans des modules ultérieurs :
--    - M03 : helpers de saisons/tournois
--    - M08 : assign_badge_number, compute_points_earned
--    - M14 : advance_winner_in_bracket
--    - M16 : refresh_season_standings
--
-- À la fin de M00, ce fichier contient les helpers transverses :
--    - update_updated_at_column()  (utilisé par tous les triggers updated_at)
--    - get_app_config(key)         (lecture typée d'app_config)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- update_updated_at_column()
-- Trigger générique pour maintenir la colonne updated_at à jour.
-- Sera attaché à toutes les tables ayant un updated_at via 19_create_triggers.sql.
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

-- Attacher le trigger à app_config dès maintenant (les autres tables le feront à leur création)
DROP TRIGGER IF EXISTS trg_app_config_updated_at ON app_config;
CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- get_app_config(p_key text)
-- Lit une valeur de configuration de façon typée, en respectant is_secret.
-- Retourne NULL si la clé est secrète et que l'appelant n'est pas SUPER_ADMIN.
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

  -- Clé inexistante
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Clé secrète : accessible uniquement via service_role
  -- (les Server Actions admin utilisent service_role, le client public utilise anon/authenticated)
  IF v_is_secret AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RETURN NULL;
  END IF;

  RETURN v_value;
END;
$$;

COMMENT ON FUNCTION get_app_config(text) IS
  'Lecture typée d''app_config. Retourne NULL si clé inexistante OU clé secrète sans privilège service_role.';

-- Permissions : exécutable par anon, authenticated et service_role
GRANT EXECUTE ON FUNCTION get_app_config(text) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Vérification post-migration
-- ---------------------------------------------------------------------------
-- Test 1 : clé publique
-- SELECT get_app_config('site_message');
-- → doit retourner le message JSON
--
-- Test 2 : clé secrète (depuis anon)
-- SELECT get_app_config('qr_encryption_key');
-- → doit retourner NULL (sauf si exécuté en service_role)
--
-- Test 3 : clé inexistante
-- SELECT get_app_config('does_not_exist');
-- → doit retourner NULL