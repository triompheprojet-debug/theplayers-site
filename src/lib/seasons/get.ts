/**
 * Récupération d'une saison par son ID (M03.G).
 *
 * service_role : cohérence avec les autres lectures admin.
 * Renvoie null si introuvable ou soft-deleted.
 */
import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Database } from '@/types/database.types'

export type Season = Database['public']['Tables']['seasons']['Row']

export async function getSeasonById(id: string): Promise<Season | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) {
    console.error('[seasons/get] Erreur getSeasonById :', error.message)
    return null
  }
  return data
}