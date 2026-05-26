-- ============================================================================
-- Migration 02 : Table app_config (configuration globale du site)
-- Module : M00 - Fondations
-- Dépend de : 01_create_enums.sql
-- Note : FK updated_by → admin_accounts sera ajoutée en M02
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  value       jsonb NOT NULL,
  description text,
  is_secret   boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid -- FK vers admin_accounts(id) ajoutée en M02
);

-- Index sur la clé (déjà UNIQUE, mais on optimise les lookups fréquents)
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- Index partiel pour les clés non secrètes (vue publique)
CREATE INDEX IF NOT EXISTS idx_app_config_public
  ON app_config(key) WHERE is_secret = false;

-- Activation de Row Level Security (policies définies en 20_create_rls_policies.sql)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed initial : clés de configuration de base
-- ---------------------------------------------------------------------------
-- ON CONFLICT DO NOTHING pour rendre le seed idempotent

INSERT INTO app_config (key, value, is_secret, description) VALUES
  (
    'active_tournament_id',
    'null'::jsonb,
    false,
    'UUID du tournoi actuellement actif (null si aucun)'
  ),
  (
    'site_message',
    '"Aucun tournoi en cours. Suivez-nous sur les réseaux pour le prochain."'::jsonb,
    false,
    'Message affiché sur l''accueil si aucun tournoi actif'
  ),
  (
    'social_links',
    '{"facebook":"","instagram":"","tiktok":"","whatsapp_public":""}'::jsonb,
    false,
    'Liens vers les réseaux sociaux du projet'
  ),
  (
    'contact_phones',
    '[]'::jsonb,
    false,
    'Liste des numéros affichés sur la page Contact'
  ),
  (
    'event_location',
    '{"address":"","maps_url":"","city":"Pointe-Noire","country":"République du Congo"}'::jsonb,
    false,
    'Lieu par défaut des événements'
  ),
  (
    'pin_max_attempts',
    '5'::jsonb,
    false,
    'Nombre maximal de tentatives PIN avant blocage'
  ),
  (
    'pin_lockout_minutes',
    '15'::jsonb,
    false,
    'Durée de blocage en minutes après échecs PIN'
  ),
  (
    'notification_retention_days',
    '90'::jsonb,
    false,
    'Durée de conservation des notifications in-app'
  ),
  (
    'message_templates',
    '{}'::jsonb,
    false,
    'Templates de messages réutilisables (admin)'
  ),
  (
    'qr_encryption_key',
    '""'::jsonb,
    true,
    'Clé AES-256 pour chiffrement des QR codes (à générer via scripts/generate-qr-keys.ts)'
  ),
  (
    'qr_signing_key',
    '""'::jsonb,
    true,
    'Clé HMAC-SHA256 pour signature des QR codes (à générer via scripts/generate-qr-keys.ts)'
  )
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Vérification post-migration
-- ---------------------------------------------------------------------------
-- SELECT key, is_secret FROM app_config ORDER BY key;
-- Doit retourner 11 lignes.