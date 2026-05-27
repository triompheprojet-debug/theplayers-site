-- ============================================================================
-- Migration 15 — activity_log (M03 — anticipé depuis M10)
-- ============================================================================
-- Journal d'audit complet de toutes les actions admin (traçabilité Règle 9.5).
-- Créée dès M03 pour éviter un stub : le wrapper lib/activity/log.ts écrira ici.
--
-- Particularité :
--   - admin_id : FK admin_accounts (existe)
--   - player_id : uuid SANS FK (profiles arrive en M06)
--
-- Pré-requis :
--   - extension pgcrypto activée (gen_random_uuid)
--   - admin_accounts (05_create_admin_accounts.sql)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table activity_log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Acteur
  admin_id        uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  player_id       uuid,  -- FK vers profiles à poser en M06

  -- Action
  action_type     text NOT NULL,
  target_table    text,
  target_id       uuid,

  -- Détails
  description     text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address      inet,
  user_agent      text,

  -- Audit
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT activity_log_action_type_not_empty
    CHECK (length(trim(action_type)) >= 2),

  CONSTRAINT activity_log_actor_present
    CHECK (admin_id IS NOT NULL OR player_id IS NOT NULL)
);

COMMENT ON TABLE public.activity_log IS
  'Journal d''audit des actions admin et événements joueur sensibles. Insert-only côté code (jamais d''UPDATE/DELETE en production).';

COMMENT ON COLUMN public.activity_log.action_type IS
  'Identifiant court de l''action (ex : tournament_created, set_active_tournament, payment_confirmed, payment_rejected).';

COMMENT ON COLUMN public.activity_log.target_table IS
  'Nom de la table affectée (ex : tournaments, seasons, payments).';

COMMENT ON COLUMN public.activity_log.metadata IS
  'Contexte additionnel : { before, after, reason, ... }. Jamais de données secrètes (PIN, tokens, etc.).';

COMMENT ON COLUMN public.activity_log.player_id IS
  'uuid de profiles.id. FK ajoutée en M06.';

-- ----------------------------------------------------------------------------
-- 2. Index
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_admin
  ON public.activity_log (admin_id, created_at DESC)
  WHERE admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_target
  ON public.activity_log (target_table, target_id)
  WHERE target_table IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_action
  ON public.activity_log (action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_created_at
  ON public.activity_log (created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Pas de trigger updated_at (table insert-only)
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 4. RLS bloquante par défaut
-- ----------------------------------------------------------------------------
-- Seul service_role écrit/lit. anon/authenticated bloqués.
-- Lecture admin via service_role depuis Server Actions.

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.activity_log FROM anon, authenticated;
GRANT  ALL ON public.activity_log TO service_role;

COMMIT;

-- ============================================================================
-- Vérifications post-migration (à exécuter séparément)
-- ============================================================================
-- SELECT count(*) FROM public.activity_log;                            -- doit valoir 0
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.activity_log'::regclass;                  -- 2 CHECK + 1 FK + PK
-- SELECT indexname FROM pg_indexes WHERE tablename = 'activity_log';   -- PK + 4 index