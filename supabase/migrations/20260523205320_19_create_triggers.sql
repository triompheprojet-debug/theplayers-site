-- ============================================================================
-- Migration 19 — Triggers (M08)
-- ============================================================================
-- Le fichier 19 était vide. Ce contenu est le premier ajout (M08).
-- ⚠️ Append-only : les modules ultérieurs ajouteront leurs triggers à la suite.
--
-- assign_badge_on_confirm
--   AFTER UPDATE ON registrations : quand status passe à 'confirmed' et que le
--   badge n'est pas encore attribué, appelle assign_badge_number() pour fixer
--   un numéro de badge atomique et unique dans le tournoi.
--
--   On positionne aussi confirmed_at = now() (transition d'état) — fait dans la
--   même fonction trigger pour rester cohérent.
--
-- Idempotent : CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS + CREATE.
-- À coller tel quel dans le SQL Editor.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.assign_badge_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Transition vers 'confirmed' uniquement (et pas déjà confirmé avant)
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    -- Horodatage de confirmation s'il n'est pas déjà posé
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.assign_badge_on_confirm() IS
  'BEFORE UPDATE : pose confirmed_at à la transition vers confirmed. L''attribution du badge se fait en AFTER (trg_registrations_assign_badge) pour disposer du NEW.id committé.';

-- Le BEFORE pose confirmed_at (modifie NEW). L'attribution de badge se fait en
-- AFTER pour lire l'état stable de la ligne et éviter de réécrire NEW pendant
-- le même cycle.
DROP TRIGGER IF EXISTS trg_registrations_confirmed_at ON public.registrations;
CREATE TRIGGER trg_registrations_confirmed_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_badge_on_confirm();

-- Fonction AFTER : déclenche l'attribution atomique du badge.
CREATE OR REPLACE FUNCTION public.trigger_assign_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed'
     AND OLD.status IS DISTINCT FROM 'confirmed'
     AND NEW.badge_number IS NULL THEN
    PERFORM public.assign_badge_number(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_assign_badge() IS
  'AFTER UPDATE : à la transition vers confirmed sans badge, appelle assign_badge_number(NEW.id) (atomique, unique par tournoi). M08.';

DROP TRIGGER IF EXISTS trg_registrations_assign_badge ON public.registrations;
CREATE TRIGGER trg_registrations_assign_badge
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_badge();

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.registrations'::regclass AND NOT tgisinternal;
--   -- trg_registrations_updated_at + trg_registrations_confirmed_at
--   --    + trg_registrations_assign_badge
--
-- Test attribution (sur un tournoi T et un joueur P déjà inscrit 'reserved') :
--   UPDATE public.registrations SET status='confirmed'
--     WHERE tournament_id='<T>' AND player_id='<P>';
--   SELECT badge_number FROM public.registrations
--     WHERE tournament_id='<T>' AND player_id='<P>';   -- → 1 (puis 2, 3, …)

-- ============================================================================
-- BLOC À AJOUTER À LA FIN DE : supabase/migrations/20260523205320_19_create_triggers.sql
-- (et à exécuter SEUL dans le SQL Editor — ne pas re-exécuter le haut du fichier)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- [M14] trg_matches_advance_winner
-- AFTER UPDATE sur matches : quand un match obtient un vainqueur (statut
-- 'completed' OU 'forfeit' avec winner_id non NULL), appelle
-- advance_winner_in_bracket(NEW.id) pour pousser le vainqueur au tour suivant.
--
-- Se redéclenche aussi si l'admin CORRIGE le vainqueur d'un match déjà
-- terminé (changement de winner_id) → le slot du match suivant est écrasé
-- avec le bon joueur.
--
-- Pas de récursion problématique : l'UPDATE du match suivant re-déclenche le
-- trigger, mais ce match n'a ni statut terminal ni winner_id → no-op.
-- ---------------------------------------------------------------------------

BEGIN;

CREATE OR REPLACE FUNCTION public.trigger_advance_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.winner_id IS NOT NULL
     AND NEW.status IN ('completed', 'forfeit')
     AND (
       OLD.status IS DISTINCT FROM NEW.status
       OR OLD.winner_id IS DISTINCT FROM NEW.winner_id
     ) THEN
    PERFORM public.advance_winner_in_bracket(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_advance_winner() IS
  'AFTER UPDATE : à l''obtention/correction d''un vainqueur (completed/forfeit), avance le vainqueur au match suivant via advance_winner_in_bracket. M14.';

DROP TRIGGER IF EXISTS trg_matches_advance_winner ON public.matches;
CREATE TRIGGER trg_matches_advance_winner
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_winner();

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.matches'::regclass AND NOT tgisinternal;
--   -- trg_matches_updated_at + trg_matches_advance_winner