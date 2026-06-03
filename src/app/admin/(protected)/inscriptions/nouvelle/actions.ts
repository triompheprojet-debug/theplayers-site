'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/permissions'
import {
  createManualRegistration,
  type ManualRegistrationInput,
} from '@/lib/registrations/manual'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { phoneSchema, pseudoSchema } from '@/lib/validation/common'
import { ROUTES } from '@/config/routes'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

/**
 * Server Actions de l'inscription manuelle (M10).
 *
 * - searchPlayersAction : recherche de joueurs existants par pseudo.
 * - createManualRegistrationAction : inscrit un joueur existant OU crée un
 *   compte walk-in puis l'inscrit (statut confirmed, espèces sur place).
 *
 * Auth admin requise. Réutilise les schémas de base (pseudo/phone) de M06.
 */

// ---------------------------------------------------------------------------
// Recherche de joueurs existants
// ---------------------------------------------------------------------------

export interface PlayerSearchResult {
  id: string
  pseudo: string
  firstName: string | null
  lastName: string | null
}

export async function searchPlayersAction(
  query: string,
): Promise<ActionResult<PlayerSearchResult[]>> {
  await requireAdmin()

  const term = typeof query === 'string' ? query.trim() : ''
  if (term.length < 2) return actionSuccess([])

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, pseudo, first_name, last_name')
    .ilike('pseudo', `%${term}%`)
    .eq('is_deleted', false)
    .eq('is_blocked', false)
    .order('pseudo', { ascending: true })
    .limit(8)

  if (error) {
    console.error('[searchPlayersAction]', error.message)
    return actionError('La recherche a échoué.')
  }

  return actionSuccess(
    (data ?? []).map((p) => ({
      id: p.id,
      pseudo: p.pseudo,
      firstName: p.first_name,
      lastName: p.last_name,
    })),
  )
}

// ---------------------------------------------------------------------------
// Création de l'inscription manuelle
// ---------------------------------------------------------------------------

const nameField = (label: string) =>
  z
    .string({ error: `Le ${label} est obligatoire.` })
    .trim()
    .min(1, { error: `Le ${label} est obligatoire.` })
    .max(50, { error: `Le ${label} ne peut pas dépasser 50 caractères.` })

const manualRegistrationSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('existing'),
    playerId: z
      .string({ error: 'Joueur introuvable.' })
      .uuid({ error: 'Joueur introuvable.' }),
  }),
  z.object({
    mode: z.literal('new'),
    firstName: nameField('prénom'),
    lastName: nameField('nom'),
    pseudo: pseudoSchema,
    phone: phoneSchema,
  }),
])

export interface ManualRegistrationOutput {
  registrationId: string
  badgeNumber: number | null
  tempPassword?: string
  redirectTo: string
}

export async function createManualRegistrationAction(
  rawInput: unknown,
): Promise<ActionResult<ManualRegistrationOutput>> {
  const session = await requireAdmin()

  const parsed = manualRegistrationSchema.safeParse(rawInput)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_'
      ;(fieldErrors[key] ??= []).push(issue.message)
    }
    return actionError('Le formulaire contient des erreurs.', fieldErrors)
  }

  const result = await createManualRegistration(
    parsed.data as ManualRegistrationInput,
    session.adminId,
  )

  if (!result.ok) {
    return actionError(manualErrorMessage(result.reason))
  }

  revalidatePath(ROUTES.admin.registrations.root)
  revalidatePath(ROUTES.admin.dashboard)
  revalidatePath(ROUTES.admin.badgeNumbers)

  return actionSuccess({
    registrationId: result.registrationId,
    badgeNumber: result.badgeNumber,
    tempPassword: result.tempPassword,
    redirectTo: ROUTES.admin.registrations.detail(result.registrationId),
  })
}

function manualErrorMessage(reason: string): string {
  switch (reason) {
    case 'no_active_tournament':
      return 'Aucun tournoi actif. Définissez-en un avant d’inscrire un joueur.'
    case 'tournament_full':
      return 'Le tournoi a atteint sa capacité maximale.'
    case 'pseudo_taken':
      return 'Ce pseudo est déjà utilisé. Choisissez-en un autre ou inscrivez le joueur existant.'
    case 'player_not_found':
      return 'Joueur introuvable.'
    case 'already_registered':
      return 'Ce joueur est déjà inscrit à ce tournoi.'
    case 'account_error':
      return 'La création du compte a échoué. Réessaie.'
    default:
      return 'L’inscription a échoué. Réessaie.'
  }
}