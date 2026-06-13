-- ============================================================================
-- Migration 09 : Table matches (M14 — Bracket)
-- Dépend de : 01_create_enums (match_status), 04_create_profiles,
--             05_create_admin_accounts, 06_create_tournaments
--
-- Contenu :
--   1. Table matches + contraintes + index
--   2. Trigger updated_at
--   3. Fonction is_bracket_published() (SECURITY DEFINER) — nécessaire car la
--      RLS de tournaments est bloquante pour anon : une sous-requête directe
--      dans la policy échouerait silencieusement.
--   4. RLS : SELECT public UNIQUEMENT si le bracket du tournoi est publié.
--      Aucune policy d'écriture (écritures via service_role exclusivement).
--   5. Ajout de matches à la publication supabase_realtime (idempotent).
--
-- Idempotent : à coller tel quel dans le SQL Editor.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Table matches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lien (étanchéité tournoi — Règle 12)
  tournament_id       uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,

  -- Position dans le bracket
  round_number        int NOT NULL,                       -- 1 = T1, 2 = T2, ...
  match_number        int NOT NULL,                       -- numéro dans le round
  bracket_position    text,                               -- "Finale", "Demi-1", "Quart-3"

  -- Joueurs (NULL avant tirage / si bye)
  player_a_id         uuid REFERENCES public.profiles(id),
  player_b_id         uuid REFERENCES public.profiles(id),
  player_a_badge      int,                                -- copie pour affichage
  player_b_badge      int,

  -- Résultat
  score_a             int,
  score_b             int,
  winner_id           uuid REFERENCES public.profiles(id),
  status              match_status NOT NULL DEFAULT 'scheduled',

  -- Chaînage vers le match suivant (avancement automatique du vainqueur)
  next_match_id       uuid REFERENCES public.matches(id),
  next_match_slot     char(1),                            -- 'A' ou 'B'

  -- Console et horaire
  console_number      int,
  wave_number         int,                                -- vague (groupe d'horaire)
  scheduled_time      timestamptz,

  -- Saisie
  played_at           timestamptz,
  scored_by           uuid REFERENCES public.admin_accounts(id),

  -- Forfait / annulation
  forfeit_player_id   uuid REFERENCES public.profiles(id),
  forfeit_reason      text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT matches_unique_position UNIQUE (tournament_id, round_number, match_number),
  CONSTRAINT matches_score_consistency CHECK (
    (status != 'completed') OR (score_a IS NOT NULL AND score_b IS NOT NULL)
  ),
  CONSTRAINT matches_winner_consistency CHECK (
    (winner_id IS NULL) OR (winner_id = player_a_id) OR (winner_id = player_b_id)
  ),
  CONSTRAINT matches_next_slot_valid CHECK (
    next_match_slot IS NULL OR next_match_slot IN ('A', 'B')
  )
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round      ON public.matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_status     ON public.matches(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_player_a   ON public.matches(player_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_b   ON public.matches(player_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_next       ON public.matches(next_match_id);

COMMENT ON TABLE public.matches IS
  'Matchs du bracket à élimination directe (M14). Écritures via service_role uniquement. Lecture publique conditionnée à bracket_visibility = published.';

-- ---------------------------------------------------------------------------
-- 2. Trigger updated_at (réutilise update_updated_at_column de la migration 18)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_matches_updated_at ON public.matches;
CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 3. is_bracket_published(p_tournament_id)
-- SECURITY DEFINER : la RLS de tournaments est bloquante pour anon ; cette
-- fonction permet à la policy de matches (et au Realtime/WALRUS) de vérifier
-- la publication sans exposer la table tournaments.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_bracket_published(p_tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tournaments t
    WHERE t.id = p_tournament_id
      AND t.bracket_visibility = 'published'
      AND t.is_deleted = false
  );
$$;

COMMENT ON FUNCTION public.is_bracket_published(uuid) IS
  'Vrai si le bracket du tournoi est publié. Utilisée par la RLS de matches (lecture publique + Realtime). N''expose ni capacity ni config.';

GRANT EXECUTE ON FUNCTION public.is_bracket_published(uuid) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS matches_select_published ON public.matches;
CREATE POLICY matches_select_published
  ON public.matches
  FOR SELECT
  TO anon, authenticated
  USING (public.is_bracket_published(tournament_id));

-- Aucune policy INSERT/UPDATE/DELETE : écritures via service_role uniquement
-- (tirage, scores, avancement — admin auth custom, M14/M15).

-- ---------------------------------------------------------------------------
-- 5. Publication Realtime (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;
END
$$;

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
-- SELECT count(*) FROM information_schema.tables
--   WHERE table_schema='public' AND table_name='matches';            -- 1
-- SELECT polname FROM pg_policies WHERE tablename='matches';
--   -- matches_select_published
-- SELECT tablename FROM pg_publication_tables
--   WHERE pubname='supabase_realtime';                               -- contient matches
-- SELECT public.is_bracket_published(
--   ((SELECT value #>> '{}' FROM app_config
--      WHERE key='active_tournament_id'))::uuid);                    -- false (draft)