'use server'

import { headers } from 'next/headers'

import { pseudoToEmail } from '@/lib/auth/pseudo-to-email'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { signInSchema } from '@/lib/validation/auth'
import { ROUTES } from '@/config/routes'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

interface SignInData {
  redirect: string
}

/**
 * Connexion joueur par pseudo + mot de passe (M06).
 *
 * - Rate limit par IP (anti brute-force).
 * - Le pseudo est reconverti en email synthétique avant signInWithPassword.
 * - Message d'erreur unique et générique (anti-énumération, Règle 8) : on ne
 *   révèle jamais si le pseudo existe.
 * - Un compte bloqué (is_blocked) est déconnecté immédiatement.
 */
export async function signIn(input: unknown): Promise<ActionResult<SignInData>> {
  // === 1. RATE LIMIT (par IP) ===
  const h = await headers()
  const ip = getClientIp(h)
  const allowed = await checkRateLimit('signIn', ip)
  if (!allowed) {
    return actionError('Trop de tentatives. Réessaie dans quelques minutes.')
  }

  // === 2. VALIDATION ZOD ===
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Pseudo ou mot de passe incorrect.')
  }
  const { pseudo, password } = parsed.data

  try {
    const supabase = await createClient()

    // === 3. AUTHENTIFICATION ===
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: pseudoToEmail(pseudo),
      password,
    })

    if (error || !signInData.user) {
      return actionError('Pseudo ou mot de passe incorrect.')
    }

    // === 4. COMPTE BLOQUÉ ? ===
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', signInData.user.id)
      .maybeSingle()

    if (profile?.is_blocked) {
      await supabase.auth.signOut()
      return actionError(
        'Votre compte est suspendu. Contactez l\'organisation pour plus d\'informations.',
      )
    }

    return actionSuccess({ redirect: ROUTES.player.dashboard })
  } catch (err) {
    console.error('[signIn]', err)
    return actionError('Une erreur est survenue. Réessaie plus tard.')
  }
}