/**
 * Création d'une saison (M03).
 *
 * Utilise service_role (RLS de seasons : SELECT public ouvert,
 * INSERT/UPDATE/DELETE réservés à service_role).
 *
 * Lève une erreur en cas d'échec — l'appelante (Server Action)
 * la traduit en `actionError`.
 */
import 'server-only'

import { logActivity } from '@/lib/activity/log'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { SeasonCreateInput } from '@/lib/validation/season'

export interface CreateSeasonResult {
  id: string
}

export async function createSeason(
  input: SeasonCreateInput,
  adminId: string,
): Promise<CreateSeasonResult> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      name: input.name,
      season_number: input.season_number,
      description: input.description?.trim() || null,
      start_date: input.start_date,
      end_date: input.end_date,
      expected_tournaments: input.expected_tournaments,
      qualification_threshold: input.qualification_threshold,
      status: 'active',
      is_deleted: false,
      created_by: adminId,
      updated_by: adminId,
    })
    .select('id')
    .single()

  if (error || !data) {
    // Erreur typique : contrainte UNIQUE sur season_number violée
    if (error?.code === '23505') {
      throw new Error(
        `Le numéro de saison ${input.season_number} est déjà utilisé.`,
      )
    }
    throw new Error(
      `Création de la saison impossible : ${error?.message ?? 'erreur inconnue'}`,
    )
  }

  await logActivity({
    adminId,
    actionType: 'season_created',
    targetTable: 'seasons',
    targetId: data.id,
    description: `Création saison ${input.season_number} — "${input.name}"`,
    metadata: {
      season_number: input.season_number,
      start_date: input.start_date,
      end_date: input.end_date,
      expected_tournaments: input.expected_tournaments,
      qualification_threshold: input.qualification_threshold,
    },
  })

  return { id: data.id }
}