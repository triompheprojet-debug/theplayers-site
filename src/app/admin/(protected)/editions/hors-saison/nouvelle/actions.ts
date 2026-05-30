'use server'

/**
 * Server Action — Création d'un tournoi Hors Saison (M03.E).
 *
 * Workflow :
 *  1. Garde SUPER_ADMIN
 *  2. Validation Zod stricte (offSeasonCreateSchema)
 *  3. Création via createTournament(kind: 'off_season')
 *  4. Revalidate la liste des éditions
 *  5. Retourne l'ID + path de redirect (consommé côté Client)
 *
 * Le redirect n'est PAS fait ici via redirect() : on laisse le client
 * gérer la transition pour pouvoir afficher un toast intermédiaire.
 */
import { revalidatePath } from 'next/cache'

import { requireSuperAdmin } from '@/lib/auth/permissions'
import { createTournament } from '@/lib/tournaments/create'
import { offSeasonCreateSchema } from '@/lib/validation/tournament'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

export interface CreateOffSeasonOutput {
  tournamentId: string
  redirectTo: string
}

export async function createOffSeasonAction(
  rawInput: unknown,
): Promise<ActionResult<CreateOffSeasonOutput>> {
  // 1. Auth
  const session = await requireSuperAdmin()

  // 2. Validation Zod
  const parsed = offSeasonCreateSchema.safeParse(rawInput)
  if (!parsed.success) {
    // Map des erreurs par chemin → fieldErrors (consommable par react-hook-form)
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

  // 3. Création
  try {
    const { id } = await createTournament(
      { kind: 'off_season', input: parsed.data },
      session.adminId,
    )

    // 4. Revalidate
    revalidatePath('/admin/editions')

    // 5. Réponse
    return actionSuccess({
      tournamentId: id,
      redirectTo: '/admin/editions',
    })
  } catch (err) {
    return actionError(
      err instanceof Error
        ? err.message
        : 'Erreur inattendue lors de la création du tournoi.',
    )
  }
}