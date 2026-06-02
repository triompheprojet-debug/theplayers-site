'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { ROUTES } from '@/config/routes'
import { pseudoToEmail } from '@/lib/auth/pseudo-to-email'
import { createClient } from '@/lib/supabase/server'
import {
  passwordChangeSchema,
  profileUpdateSchema,
  type PasswordChangeInput,
  type ProfileUpdateInput,
} from '@/lib/validation/profile'
import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

/**
 * Convertit une erreur Zod v4 en `fieldErrors` (Record<string, string[]>)
 * compatible avec `ActionResult`. Zod 4 : `z.flattenError` (le `.flatten()`
 * d'instance est déprécié).
 */
function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const flat = z.flattenError(error)
  // Zod 4 type `fieldErrors` comme `{}` dès qu'un schéma porte un `.refine`/
  // `.transform` au niveau objet (cas de `passwordChangeSchema`). On élargit
  // le type pour itérer en sécurité.
  const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>
  const out: Record<string, string[]> = {}
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) out[key] = messages
  }
  return out
}

/**
 * Met à jour les informations personnelles du joueur connecté.
 *
 * Le pseudo, les stats et les champs de sanction NE sont PAS modifiables ici :
 * le trigger `protect_profile_columns` (M06) réécrit toute tentative à l'ancienne
 * valeur. On n'envoie donc que first_name / last_name / phone.
 */
export async function updateProfile(
  input: ProfileUpdateInput,
): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(
      'Veuillez corriger les champs en surbrillance.',
      toFieldErrors(parsed.error),
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return actionError('Session expirée. Reconnecte-toi.')

  const { firstName, lastName, phone } = parsed.data
  const { error } = await supabase
    .from('profiles')
    .update({ first_name: firstName, last_name: lastName, phone })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfile]', error.message)
    return actionError('La mise à jour a échoué. Réessaie.')
  }

  revalidatePath(ROUTES.player.profile)
  revalidatePath(ROUTES.player.dashboard)
  return actionSuccess(undefined)
}

/**
 * Change le mot de passe du joueur connecté.
 *
 * Sécurité : on re-vérifie le mot de passe actuel via `signInWithPassword`
 * (sur l'email synthétique reconstruit depuis le pseudo) avant d'appeler
 * `updateUser`. Sans cette étape, n'importe quelle session ouverte pourrait
 * changer le mot de passe.
 */
export async function changePassword(
  input: PasswordChangeInput,
): Promise<ActionResult> {
  const parsed = passwordChangeSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(
      'Veuillez corriger les champs en surbrillance.',
      toFieldErrors(parsed.error),
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return actionError('Session expirée. Reconnecte-toi.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('pseudo')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError || !profile) {
    return actionError('Profil introuvable.')
  }

  const { currentPassword, newPassword } = parsed.data

  // Re-vérification du mot de passe actuel.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: pseudoToEmail(profile.pseudo),
    password: currentPassword,
  })
  if (signInError) {
    return actionError('Mot de passe actuel incorrect.', {
      currentPassword: ['Mot de passe actuel incorrect.'],
    })
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (updateError) {
    console.error('[changePassword]', updateError.message)
    return actionError('Le changement de mot de passe a échoué. Réessaie.')
  }

  revalidatePath(ROUTES.player.profile)
  return actionSuccess(undefined)
}