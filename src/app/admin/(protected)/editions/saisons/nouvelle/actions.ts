'use server'

/**
 * Server Action — Création d'une saison (M03.F).
 *
 * Workflow :
 *  1. Garde SUPER_ADMIN
 *  2. Validation Zod (seasonCreateSchema)
 *  3. Création via createSeason() (gère le log + la contrainte UNIQUE)
 *  4. Revalidate la liste des éditions
 *  5. Retourne l'ID + path de redirect
 */
import { revalidatePath } from 'next/cache'

import { requireSuperAdmin } from '@/lib/auth/permissions'
import { createSeason } from '@/lib/seasons/create'
import { seasonCreateSchema } from '@/lib/validation/season'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

export interface CreateSeasonOutput {
  seasonId: string
  redirectTo: string
}

export async function createSeasonAction(
  rawInput: unknown,
): Promise<ActionResult<CreateSeasonOutput>> {
  // 1. Auth
  const session = await requireSuperAdmin()

  // 2. Validation Zod
  const parsed = seasonCreateSchema.safeParse(rawInput)
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

  // 3. Création
  try {
    const { id } = await createSeason(parsed.data, session.adminId)

    // 4. Revalidate
    revalidatePath('/admin/editions')

    // 5. Réponse
    return actionSuccess({
      seasonId: id,
      redirectTo: '/admin/editions',
    })
  } catch (err) {
    return actionError(
      err instanceof Error
        ? err.message
        : 'Erreur inattendue lors de la création de la saison.',
    )
  }
}