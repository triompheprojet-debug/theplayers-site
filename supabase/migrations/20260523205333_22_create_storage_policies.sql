-- ============================================================================
-- Migration 22 — Storage policies (M09 — bucket payment-proofs)
-- ============================================================================
-- Le bucket 'payment-proofs' existe déjà (privé, 5 Mo, image/jpeg|png|webp).
-- Ce fichier ajoute UNIQUEMENT les policies RLS sur storage.objects pour ce
-- bucket. Append-only : les autres buckets (documents, avatars, tournament-assets)
-- recevront leurs policies dans leurs modules respectifs.
--
-- Convention de chemin (cohérente avec submit-proof.ts) :
--   payment-proofs/{player_id}/{registration_id}/{uuid}.ext
--   → le 1er segment du chemin = auth.uid() du joueur propriétaire.
--
-- Règles :
--   - INSERT : un joueur n'écrit QUE dans son propre dossier ({uid}/...).
--   - SELECT : un joueur lit QUE ses propres fichiers. L'admin lit tout via
--     service_role (URL signée) — pas de policy publique.
--   - UPDATE/DELETE : aucun (les preuves ne sont ni modifiées ni supprimées
--     par le joueur ; nettoyage éventuel = service_role).
--
-- storage.foldername(name)[1] = premier segment du chemin (le {player_id}).
-- Idempotent : DROP POLICY IF EXISTS + CREATE.
-- ============================================================================

BEGIN;

-- INSERT : le joueur dépose dans son propre dossier
DROP POLICY IF EXISTS payment_proofs_insert_own ON storage.objects;
CREATE POLICY payment_proofs_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT : le joueur lit ses propres fichiers
DROP POLICY IF EXISTS payment_proofs_select_own ON storage.objects;
CREATE POLICY payment_proofs_select_own
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
-- SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname='storage' AND tablename='objects'
--     AND policyname LIKE 'payment_proofs%';
--   -- payment_proofs_insert_own (INSERT) + payment_proofs_select_own (SELECT)
--
-- Rappel : le bucket reste PRIVÉ. L'accès admin se fait par URL signée
-- générée en service_role (createSignedUrl), jamais par accès public.