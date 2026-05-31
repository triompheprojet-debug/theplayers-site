'use server'

/**
 * Server Action — Création de la Grande Finale d'une saison (M03.H).
 *
 * Workflow :
 *  1. Garde SUPER_ADMIN
 *  2. Validation Zod (grandFinalCreateSchema — season_id, pas de number)
 *  3. Vérifie que la saison existe
 *  4. Vérifie qu'aucune Grande Finale n'existe déjà (1 seule par saison)
 *  5. Création via createTournament(kind: 'grand_final')
 *  6. Revalidate la page détail saison + liste éditions
 */
import { revalidatePath } from 'next/cache'

import { requireSuperAdmin } from '@/lib/auth/permissions'
import { getSeasonById } from '@/lib/seasons/get'
import { createTournament } from '@/lib/tournaments/create'
import {
  hasGrandFinal,
  listTournamentsBySeason,
} from '@/lib/tournaments/list-by-season'
import { grandFinalCreateSchema } from '@/lib/validation/tournament'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

export interface CreateGrandFinalOutput {
  tournamentId: string
  redirectTo: string
}

export async function createGrandFinalAction(
  rawInput: unknown,
): Promise<ActionResult<CreateGrandFinalOutput>> {
  // 1. Auth
  const session = await requireSuperAdmin()

  // 2. Validation Zod
  const parsed = grandFinalCreateSchema.safeParse(rawInput)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return actionError(
      'Le formulaire contient des erreurs. Corrige les champs en rouge.',
      fieldErrors,
    )
  }

  // 3. Vérifier l'existence de la saison
  const season = await getSeasonById(parsed.data.season_id)
  if (!season) {
    return actionError('Saison introuvable ou supprimée.')
  }

  // 4. Vérifier qu'aucune Grande Finale n'existe déjà
  const tournaments = await listTournamentsBySeason(parsed.data.season_id)
  if (hasGrandFinal(tournaments)) {
    return actionError(
      'Une Grande Finale existe déjà pour cette saison.',
    )
  }

  // 5. Création
  try {
    const { id } = await createTournament(
      { kind: 'grand_final', input: parsed.data },
      session.adminId,
    )

    // 6. Revalidate
    const detailPath = `/admin/editions/saisons/${parsed.data.season_id}`
    revalidatePath(detailPath)
    revalidatePath('/admin/editions')

    return actionSuccess({
      tournamentId: id,
      redirectTo: detailPath,
    })
  } catch (err) {
    // Garde-fou : index unique partiel GF/saison côté DB
    if (
      err instanceof Error &&
      err.message.includes('uniq_grand_final_per_season')
    ) {
      return actionError(
        'Une Grande Finale existe déjà pour cette saison.',
      )
    }
    return actionError(
      err instanceof Error
        ? err.message
        : 'Erreur inattendue lors de la création de la Grande Finale.',
    )
  }
}