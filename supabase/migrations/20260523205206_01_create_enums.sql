-- ============================================================================
-- Migration 01 : Création des types enum du projet
-- Module : M00 - Fondations
-- Idempotente : oui (DO $$ + IF NOT EXISTS via pg_type)
-- ============================================================================

-- Extensions requises (déjà actives en infrastructure mais on sécurise)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Rôles back-office
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'referee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Type de tournoi (Hors Saison / Saison / Grande Finale)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE tournament_type AS ENUM ('off_season', 'season', 'grand_final');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 3. Statut du tournoi (cycle de vie)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE tournament_status AS ENUM (
    'draft',
    'registrations_open',
    'registrations_closed',
    'in_progress',
    'completed',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 4. Méthode de paiement (Règle 3 — terminologie stricte)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'mtn_mobile_money',
    'airtel_money',
    'cash'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 5. Statut d'une inscription
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM (
    'reserved',
    'awaiting_verification',
    'confirmed',
    'rejected',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 6. Statut d'un paiement (preuve)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'confirmed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 7. Statut d'un match
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE match_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'forfeit',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 8. Rangs de ligue (Bronze → Légende)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE player_rank AS ENUM (
    'bronze',
    'silver',
    'gold',
    'diamond',
    'legend'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 9. Statut d'une tâche planifiée
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'pending',
    'running',
    'done',
    'failed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 10. Types de notifications
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'payment_confirmed',
    'payment_rejected',
    'registration_reminder',
    'bracket_published',
    'match_upcoming',
    'tournament_starting',
    'admin_message',
    'badge_ready'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 11. Types de tâches planifiées
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE job_type AS ENUM (
    'payment_reminder',
    'registration_closing',
    'bracket_auto_publish',
    'tournament_auto_start',
    'tournament_auto_archive',
    'season_standings_refresh',
    'document_generation',
    'notification_dispatch'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Vérification post-migration
-- ---------------------------------------------------------------------------
-- À exécuter après la migration pour valider :
-- SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
-- Doit retourner 11 lignes.