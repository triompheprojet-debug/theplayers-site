'use server'

/**
 * Server Action — Connexion admin.
 *
 * Sécurité :
 *  - Message générique "Identifiants incorrects" pour ne pas révéler
 *    si le username existe ou si le compte est désactivé (Règle 8).
 *  - Seuls `account_locked` et `lockout_just_triggered` exposent un
 *    message explicite avec le temps restant (utile à l'admin légitime).
 *
 * Effets de bord :
 *  - Rate-limit DB en cas de PIN erroné (applyFailedAttempt)
 *  - Création du cookie httpOnly 8h en cas de succès
 *
 * Routage : la cible de redirection dépend du rôle (adminHomeRoute) — un
 * arbitre pur atterrit dans son espace dédié /arbitre, pas dans le back-office.
 */
import { verifyAdminCredentials } from '@/lib/auth/admin-auth'
import { adminHomeRoute } from '@/lib/auth/home-route'
import { createAdminSession } from '@/lib/auth/session'
import { adminLoginSchema } from '@/lib/validation/auth'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

export interface AdminSignInInput {
  username: string
  pin: string
}

export interface AdminSignInData {
  redirect: string
}

const GENERIC_ERROR = 'Identifiants incorrects.'

export async function adminSignIn(
  input: AdminSignInInput,
): Promise<ActionResult<AdminSignInData>> {
  // 1. Validation Zod
  const parsed = adminLoginSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(GENERIC_ERROR)
  }
  const { username, pin } = parsed.data

  // 2. Vérification credentials (gère le rate-limit en interne)
  const result = await verifyAdminCredentials(username, pin)

  if (!result.ok) {
    if (
      result.reason === 'account_locked' ||
      result.reason === 'lockout_just_triggered'
    ) {
      const minutes = computeMinutesUntil(result.lockedUntil!)
      const plural = minutes > 1 ? 's' : ''
      const message =
        result.reason === 'lockout_just_triggered'
          ? `Trop de tentatives. Compte bloqué pour ${minutes} minute${plural}.`
          : `Compte temporairement bloqué. Réessaie dans ${minutes} minute${plural}.`
      return actionError(message)
    }
    // invalid_credentials et tout autre cas → message générique
    return actionError(GENERIC_ERROR)
  }

  // 3. Succès — création de la session
  await createAdminSession({
    adminId: result.account.id,
    username: result.account.username,
    role: result.account.role,
  })

  // 4. Redirection selon le rôle (arbitre → /arbitre, sinon /admin/dashboard)
  return actionSuccess({ redirect: adminHomeRoute(result.account.role) })
}

function computeMinutesUntil(isoTime: string): number {
  const remainingMs = new Date(isoTime).getTime() - Date.now()
  return Math.max(1, Math.ceil(remainingMs / 60_000))
}