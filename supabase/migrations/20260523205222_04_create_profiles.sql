-- ============================================================================
-- Migration 04 — profiles (M06 — Authentification Joueur)
-- ============================================================================
-- Étend auth.users (Supabase Auth) avec les données métier des joueurs.
-- Les joueurs s'authentifient par PSEUDO + mot de passe (Règle 2) :
--   le pseudo est converti en email synthétique pseudo@theplayers.local
--   par la Server Action signUp (lib/auth/pseudo-to-email.ts).
--
-- Ce fichier contient (module M06 auto-contenu) :
--   1. Table profiles (FK id -> auth.users ON DELETE CASCADE)
--   2. Index (dont unique case-insensitive sur LOWER(pseudo))
--   3. Trigger updated_at
--   4. Trigger handle_new_user : création ATOMIQUE de profiles à l'inscription
--   5. Trigger protect_profile_columns : champs sensibles non modifiables joueur
--   6. RLS profiles (SELECT/UPDATE de son propre profil uniquement)
--   7. FK reportées depuis M03 (profiles n'existait pas) :
--        tournaments.winner_player_id / runner_up_player_id / third_player_id
--        activity_log.player_id
--      -> toutes ON DELETE SET NULL (préserver l'historique des tournois).
--
-- Pré-requis :
--   - extension pgcrypto (gen_random_uuid) — déjà active
--   - auth.users (Supabase Auth) — natif
--   - tournaments (06_create_tournaments.sql)
--   - activity_log (15_create_activity_log.sql)
--   - fonction update_updated_at_column() (18_create_functions.sql)
--
-- Studio Auth requis : Email confirmation = OFF (emails synthétiques jamais
-- délivrés), Email signup = ON, Phone signup = OFF. (confirmé)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identité
  pseudo          text NOT NULL UNIQUE,   -- identifiant principal affiché (Règle 2)
  first_name      text,
  last_name       text,
  phone           text NOT NULL,          -- WhatsApp principal, PAS un identifiant de login

  -- Compte
  avatar_url      text,

  -- Statistiques agrégées (cache, alimenté par service_role)
  tournaments_played int  NOT NULL DEFAULT 0,
  best_finish     text,
  total_points    int  NOT NULL DEFAULT 0,

  -- Sanctions
  is_blocked      boolean NOT NULL DEFAULT false,
  blocked_until   timestamptz,

  -- Audit
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  is_deleted      boolean NOT NULL DEFAULT false,

  -- Contraintes métier
  CONSTRAINT profiles_pseudo_format CHECK (
    pseudo ~ '^[A-Za-z0-9_-]{3,30}$'
  ),
  CONSTRAINT profiles_phone_not_empty CHECK (
    length(trim(phone)) >= 6
  ),
  CONSTRAINT profiles_total_points_nonneg CHECK (
    total_points >= 0
  ),
  CONSTRAINT profiles_tournaments_played_nonneg CHECK (
    tournaments_played >= 0
  )
);

COMMENT ON TABLE public.profiles IS
  'Joueurs. Étend auth.users. Auth par pseudo + mot de passe (email synthétique @theplayers.local). Le pseudo est l''identifiant affiché (Règle 2).';

COMMENT ON COLUMN public.profiles.pseudo IS
  'Identifiant principal affiché. Unique. Format ^[A-Za-z0-9_-]{3,30}$. Immuable côté joueur (protect_profile_columns).';

COMMENT ON COLUMN public.profiles.phone IS
  'Numéro WhatsApp (normalisé +242 côté Zod). N''est jamais un identifiant de connexion.';

COMMENT ON COLUMN public.profiles.total_points IS
  'Cumul global de points. Alimenté uniquement par service_role (calcul de classement). Non modifiable par le joueur.';

COMMENT ON COLUMN public.profiles.is_blocked IS
  'Sanction d''exclusion. Un joueur bloqué ne peut pas se connecter (vérifié dans la Server Action signIn). Non modifiable par le joueur.';

COMMENT ON COLUMN public.profiles.is_deleted IS
  'Soft delete. Les profils ne sont jamais supprimés physiquement (audit trail).';

-- ----------------------------------------------------------------------------
-- 2. Index
-- ----------------------------------------------------------------------------
-- Unicité case-insensitive du pseudo (sur les comptes non supprimés).
-- Doublé avec la contrainte UNIQUE de colonne (sensible à la casse) : ici on
-- garantit aussi que "John" et "john" ne coexistent pas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_pseudo_lower
  ON public.profiles (LOWER(pseudo))
  WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles (phone)
  WHERE NOT is_deleted;

-- ----------------------------------------------------------------------------
-- 3. Trigger updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. Trigger handle_new_user : création ATOMIQUE du profil à l'inscription
-- ----------------------------------------------------------------------------
-- À chaque INSERT dans auth.users (via supabase.auth.signUp), on crée la ligne
-- profiles correspondante à partir de raw_user_meta_data (pseudo, phone, etc.).
-- SECURITY DEFINER : la fonction s'exécute avec les droits du propriétaire
-- (bypass RLS et grants) → l'INSERT direct par authenticated reste interdit.
-- Atomicité : si l'INSERT profiles échoue (ex : pseudo dupliqué), l'INSERT
-- auth.users est annulé dans la même transaction.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, pseudo, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'pseudo',
    NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Crée profiles à partir de auth.users.raw_user_meta_data (pseudo, phone, first_name, last_name). Déclenché AFTER INSERT ON auth.users. Atomique avec la création du compte.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. Trigger protect_profile_columns : champs sensibles non modifiables joueur
-- ----------------------------------------------------------------------------
-- RLS autorise un joueur à UPDATE sa propre ligne, mais certaines colonnes ne
-- doivent JAMAIS être modifiées côté joueur (sanctions, points, pseudo...).
-- On détecte le contexte : auth.uid() IS NULL => appel service_role/admin
-- (tout permis) ; sinon => session joueur, on réécrit les colonnes protégées
-- à leur valeur d'origine (OLD).
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Contexte service_role / admin (pas de session joueur) : aucune restriction
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Contexte joueur : forcer les colonnes sensibles à leur valeur d'origine
  NEW.pseudo             := OLD.pseudo;             -- immuable côté joueur
  NEW.is_blocked         := OLD.is_blocked;
  NEW.blocked_until      := OLD.blocked_until;
  NEW.total_points       := OLD.total_points;
  NEW.tournaments_played := OLD.tournaments_played;
  NEW.best_finish        := OLD.best_finish;
  NEW.is_deleted         := OLD.is_deleted;
  NEW.created_at         := OLD.created_at;
  NEW.id                 := OLD.id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_columns() IS
  'Empêche un joueur de modifier les colonnes sensibles de son profil (pseudo, sanctions, stats, soft delete). service_role/admin (auth.uid() IS NULL) non restreint.';

DROP TRIGGER IF EXISTS trg_profiles_protect_columns ON public.profiles;

CREATE TRIGGER trg_profiles_protect_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_columns();

-- ----------------------------------------------------------------------------
-- 6. RLS profiles
-- ----------------------------------------------------------------------------
-- Un joueur lit et modifie UNIQUEMENT son propre profil.
-- Pas de lecture publique (les classements passeront par une vue dédiée plus tard).
-- INSERT : aucune policy => interdit à authenticated. Seul handle_new_user
--          (SECURITY DEFINER) et service_role insèrent.
-- DELETE : aucune policy => interdit. Soft delete via service_role uniquement.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL    ON public.profiles FROM anon, authenticated;
GRANT  SELECT, UPDATE ON public.profiles TO authenticated;
GRANT  ALL    ON public.profiles TO service_role;

-- SELECT : son propre profil, non supprimé
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND NOT is_deleted);

-- UPDATE : son propre profil (les colonnes sensibles sont protégées par trigger)
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND NOT is_deleted)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 7. FK reportées depuis M03 (profiles existe désormais)
-- ----------------------------------------------------------------------------
-- ON DELETE SET NULL : si un profil est un jour supprimé physiquement, on ne
-- veut pas perdre la ligne du tournoi / du log (audit trail préservé).
-- Idempotent : check explicite sur pg_constraint avant ADD.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tournaments_winner_player_id_fkey'
      AND conrelid = 'public.tournaments'::regclass
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_winner_player_id_fkey
      FOREIGN KEY (winner_player_id)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tournaments_runner_up_player_id_fkey'
      AND conrelid = 'public.tournaments'::regclass
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_runner_up_player_id_fkey
      FOREIGN KEY (runner_up_player_id)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tournaments_third_player_id_fkey'
      AND conrelid = 'public.tournaments'::regclass
  ) THEN
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_third_player_id_fkey
      FOREIGN KEY (third_player_id)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'activity_log_player_id_fkey'
      AND conrelid = 'public.activity_log'::regclass
  ) THEN
    ALTER TABLE public.activity_log
      ADD CONSTRAINT activity_log_player_id_fkey
      FOREIGN KEY (player_id)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Vérifications post-migration (à exécuter séparément, hors transaction)
-- ============================================================================
-- SELECT count(*) FROM public.profiles;                        -- doit valoir 0
--
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.profiles'::regclass;              -- PK + UNIQUE(pseudo) + FK(auth.users) + 4 CHECK
--
-- SELECT indexname FROM pg_indexes WHERE tablename = 'profiles';
--   -- PK + idx_profiles_pseudo_lower (unique) + idx_profiles_phone
--
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'public.profiles'::regclass AND NOT tgisinternal;
--   -- trg_profiles_updated_at + trg_profiles_protect_columns
--
-- SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'auth.users'::regclass AND tgname = 'on_auth_user_created';
--   -- doit lister on_auth_user_created
--
-- SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'profiles';
--   -- profiles_select_own (SELECT) + profiles_update_own (UPDATE)
--
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.tournaments'::regclass AND contype = 'f';
--   -- doit inclure les 3 FK *_player_id_fkey + created_by/updated_by + season_id
--
-- SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.activity_log'::regclass AND contype = 'f';
--   -- doit inclure activity_log_player_id_fkey