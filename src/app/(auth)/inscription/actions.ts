'use server'

import { headers } from 'next/headers'

import { pseudoToEmail } from '@/lib/auth/pseudo-to-email'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'
import { sanitizeDisplayName } from '@/lib/security/sanitize'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { signUpSchema } from '@/lib/validation/auth'
import { ROUTES } from '@/config/routes'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

/** Cible de redirection après inscription réussie. */
interface SignUpData {
  redirect: string
}

/**
 * Inscription joueur (M06).
 *
 * Défense en profondeur (4 couches, le moins cher d'abord) :
 *   1. Honeypot (company_website) — rejet silencieux en réponse leurre
 *   2. Rate limit par IP (protège le quota avant tout traitement coûteux)
 *   3. Validation Zod (signUpSchema)
 *   4. Turnstile (vérification serveur)
 * puis : vérif pseudo libre → création du compte (le trigger SQL crée profiles).
 *
 * Messages d'erreur génériques (anti-énumération, Règle 8).
 */
export async function signUp(input: unknown): Promise<ActionResult<SignUpData>> {
  const raw = (input ?? {}) as Record<string, unknown>

  // === 1. HONEYPOT === (réponse leurre : on NE crée rien, mais on "réussit")
  if (typeof raw.company_website === 'string' && raw.company_website.length > 0) {
    return actionSuccess({ redirect: ROUTES.player.dashboard })
  }

  // === 2. RATE LIMIT (par IP) ===
  const h = await headers()
  const ip = getClientIp(h)
  const allowed = await checkRateLimit('signUp', ip)
  if (!allowed) {
    return actionError('Trop de tentatives. Réessaie dans quelques minutes.')
  }

  // === 3. VALIDATION ZOD ===
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_'
      ;(fieldErrors[key] ??= []).push(issue.message)
    }
    return actionError('Données invalides.', fieldErrors)
  }
  const data = parsed.data

  // === 4. TURNSTILE (vérification serveur) ===
  const turnstile = await verifyTurnstile(data.turnstileToken, ip)
  if (!turnstile.success) {
    return actionError('Vérification anti-robot échouée. Réessaie.')
  }

  try {
    // === 5. PSEUDO LIBRE ? === (service_role : bypass RLS pour lire profiles)
    // L'unicité réelle (y compris insensible à la casse) est garantie par la DB
    // et par l'email synthétique en minuscules ; ce pré-check donne un message
    // de champ propre dans le cas exact le plus fréquent.
    const admin = createServiceRoleClient()
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('pseudo', data.pseudo)
      .maybeSingle()

    if (existing) {
      return actionError('Données invalides.', {
        pseudo: ['Ce pseudo est déjà pris.'],
      })
    }

    // === 6. CRÉATION DU COMPTE ===
    // Le trigger handle_new_user lit raw_user_meta_data et crée profiles
    // atomiquement. Email confirmation = OFF → session établie immédiatement.
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: pseudoToEmail(data.pseudo),
      password: data.password,
      options: {
        data: {
          pseudo: data.pseudo,
          phone: data.phone,
          first_name: sanitizeDisplayName(data.firstName),
          last_name: sanitizeDisplayName(data.lastName),
        },
      },
    })

    if (error) {
      // Compte déjà existant (variante de casse, etc.)
      if (
        error.code === 'user_already_exists' ||
        /already registered|already been registered/i.test(error.message)
      ) {
        return actionError('Données invalides.', {
          pseudo: ['Ce pseudo est déjà pris.'],
        })
      }
      // Échec du trigger (cause la plus probable : pseudo pris en condition de course)
      if (/database error|saving new user/i.test(error.message)) {
        return actionError('Données invalides.', {
          pseudo: ['Ce pseudo est déjà pris.'],
        })
      }
      console.error('[signUp]', error.code, error.message)
      return actionError('La création du compte a échoué. Réessaie plus tard.')
    }

    return actionSuccess({ redirect: ROUTES.player.dashboard })
  } catch (err) {
    console.error('[signUp]', err)
    return actionError('Une erreur est survenue. Réessaie plus tard.')
  }
}