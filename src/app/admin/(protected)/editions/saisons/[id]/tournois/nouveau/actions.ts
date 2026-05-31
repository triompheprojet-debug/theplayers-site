'use server'

/**
 * Server Action — Création d'un tournoi de saison (M03.G-2).
 *
 * Workflow :
 *  1. Garde SUPER_ADMIN
 *  2. Validation Zod (seasonTournamentCreateSchema — inclut season_id + number)
 *  3. Vérifie que la saison existe et n'est pas supprimée
 *  4. Création via createTournament(kind: 'season')
 *  5. Revalidate la page détail saison + liste éditions
 */
import { revalidatePath } from 'next/cache'

import { requireSuperAdmin } from '@/lib/auth/permissions'
import { getSeasonById } from '@/lib/seasons/get'
import { createTournament } from '@/lib/tournaments/create'
import { seasonTournamentCreateSchema } from '@/lib/validation/tournament'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

export interface CreateSeasonTournamentOutput {
  tournamentId: string
  redirectTo: string
}

export async function createSeasonTournamentAction(
  rawInput: unknown,
): Promise<ActionResult<CreateSeasonTournamentOutput>> {
  // 1. Auth
  const session = await requireSuperAdmin()

  // 2. Validation Zod
  const parsed = seasonTournamentCreateSchema.safeParse(rawInput)
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

  // 4. Création
  try {
    const { id } = await createTournament(
      { kind: 'season', input: parsed.data },
      session.adminId,
    )

    // 5. Revalidate
    const detailPath = `/admin/editions/saisons/${parsed.data.season_id}`
    revalidatePath(detailPath)
    revalidatePath('/admin/editions')

    return actionSuccess({
      tournamentId: id,
      redirectTo: detailPath,
    })
  } catch (err) {
    // Erreur fréquente : tournament_number déjà pris (index unique partiel)
    if (err instanceof Error && err.message.includes('uniq_tournament_number')) {
      return actionError(
        `Le numéro de tournoi ${parsed.data.tournament_number} est déjà utilisé dans cette saison.`,
      )
    }
    return actionError(
      err instanceof Error
        ? err.message
        : 'Erreur inattendue lors de la création du tournoi.',
    )
  }
}