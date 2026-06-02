'use server'

import { revalidatePath } from 'next/cache'

import { ROUTES } from '@/config/routes'
import { createReservedRegistration } from '@/lib/registrations/create'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { createClient } from '@/lib/supabase/server'
import {
  createReservationSchema,
  type CreateReservationInput,
} from '@/lib/validation/registration'
import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

/**
 * Réserve une place pour le joueur connecté sur le tournoi ACTIF.
 *
 * - Auth check (session joueur).
 * - Rate-limit `registration` par user id (pas IP — partage fréquent en 4G).
 * - Honeypot anti-bot (`website` doit rester vide).
 * - Le tournoi est résolu côté serveur (jamais envoyé par le client) → anti-triche.
 * - `createReservedRegistration` applique les contrôles métier (ouvertes,
 *   complet, doublon) sans jamais exposer la capacité (Règle 1).
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<ActionResult<{ registrationId: string }>> {
  const parsed = createReservationSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Requête invalide.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return actionError('Session expirée. Reconnecte-toi.')

  // Rate-limit par utilisateur
  const allowed = await checkRateLimit('registration', user.id)
  if (!allowed) {
    return actionError('Trop de tentatives. Réessaie dans une minute.')
  }

  const result = await createReservedRegistration(user.id)

  if (!result.ok) {
    switch (result.reason) {
      case 'no_active_tournament':
        return actionError("Aucun tournoi n'est ouvert actuellement.")
      case 'registrations_closed':
        return actionError('Les inscriptions sont fermées.')
      case 'tournament_full':
        return actionError(
          "Les inscriptions ne sont plus disponibles pour ce tournoi.",
        )
      case 'already_registered':
        return actionError('Tu es déjà inscrit à ce tournoi.')
      default:
        return actionError('La réservation a échoué. Réessaie.')
    }
  }

  revalidatePath(ROUTES.player.dashboard)
  revalidatePath(ROUTES.player.registration)
  return actionSuccess({ registrationId: result.registrationId })
}