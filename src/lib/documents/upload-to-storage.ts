import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Upload d'un PDF dans le bucket privé `documents` (M11).
 *
 * Chemin : {player_id}/{tournament_id}/{registration_id}_badge.pdf
 * Le 1er segment = player_id pour cohérence avec la policy `select_own`.
 * Écriture en service_role (bypass RLS). `upsert` pour permettre la
 * régénération (écrase le PDF précédent).
 */
const BUCKET = 'documents'

export async function uploadDocumentPdf(
  playerId: string,
  tournamentId: string,
  registrationId: string,
  pdf: Buffer,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const supabase = createServiceRoleClient()
  const path = `${playerId}/${tournamentId}/${registrationId}_badge.pdf`

  const { error } = await supabase.storage.from(BUCKET).upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (error) {
    console.error('[uploadDocumentPdf]', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true, path }
}