-- ============================================================================
-- Migration 17 (partielle - M00) : Vues SQL
-- Module : M00 - Fondations
-- Dépend de : 02_create_app_config.sql
--
-- ⚠️ Cette migration sera étendue dans des modules ultérieurs :
--    - M14 : public_tournament_view, public_bracket_view
--    - M16 : season_leaderboard_view
--
-- À la fin de M00, ce fichier ne contient que public_app_config_view.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- public_app_config_view
-- Expose uniquement les clés non-secrètes de app_config au client public.
-- Utilisée par l'anon role et le rôle authenticated.
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
  'Configuration publique du site : exclut les clés is_secret = true (qr_encryption_key, qr_signing_key, etc.)';

-- Permissions explicites sur la vue
GRANT SELECT ON public_app_config_view TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vérification post-migration
-- ---------------------------------------------------------------------------
-- SELECT * FROM public_app_config_view ORDER BY key;
-- Doit retourner 9 lignes (les 2 clés secrètes qr_* doivent être absentes).