import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * URL signée courte (5 min) vers un document du bucket privé `documents` (M11).
 * Jamais d'URL publique. Générée à la demande (téléchargement joueur / admin).
 */
const BUCKET = 'documents'
const DEFAULT_TTL_SECONDS = 300

export async function createDocumentSignedUrl(
  storagePath: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
  download: boolean | string = false,  
): Promise<string | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, ttlSeconds, download ? { download } : undefined)

  if (error) {
    console.error('[createDocumentSignedUrl]', error.message)
    return null
  }
  return data?.signedUrl ?? null
}