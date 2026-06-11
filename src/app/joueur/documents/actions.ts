'use server'

import { createDocumentSignedUrl } from '@/lib/documents/signed-url'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { ActionResult } from '@/types/api.types'

/**
 * Téléchargement d'un document par le joueur (M11).
 *
 * Vérifie l'appartenance (player_id === user.id) AVANT de signer l'URL.
 * Lecture du document en service_role (strictement filtrée sur l'utilisateur
 * authentifié), puis URL signée courte (5 min) du bucket privé `documents`.
 */
export async function downloadDocument(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const admin = createServiceRoleClient()
  const { data: doc, error } = await admin
    .from('documents')
    .select('storage_path, player_id, is_valid')
    .eq('id', documentId)
    .maybeSingle()

  if (error || !doc || doc.player_id !== user.id) {
    return { success: false, error: 'Document introuvable' }
  }
  if (!doc.is_valid) {
    return { success: false, error: 'Ce document doit être régénéré.' }
  }

  const url = await createDocumentSignedUrl(doc.storage_path, 300, true)
  if (!url) return { success: false, error: 'Lien indisponible' }
  return { success: true, data: { url } }
}