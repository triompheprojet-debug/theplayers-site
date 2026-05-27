/**
 * Politique anti-brute-force du PIN admin.
 *
 * Après ADMIN_MAX_FAILED_ATTEMPTS PINs incorrects consécutifs, le compte
 * est verrouillé pour ADMIN_LOCK_DURATION_MINUTES minutes. À l'expiration
 * du verrouillage, le compteur est remis à 0 et l'admin peut réessayer.
 *
 * Valeurs durcies en constantes (non configurables via l'UI) pour éviter
 * qu'un SUPER_ADMIN compromis ne désactive la protection. Si une évolution
 * opérationnelle nécessite de les rendre dynamiques, les promouvoir dans
 * `app_config` en M20 (configuration globale admin).
 */
import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const ADMIN_MAX_FAILED_ATTEMPTS = 5
export const ADMIN_LOCK_DURATION_MINUTES = 15

export interface RateLimitState {
  failed_attempts: number
  locked_until: string | null
}

/**
 * Pure : le compte est-il actuellement verrouillé ?
 */
export function isLocked(account: RateLimitState): boolean {
  if (!account.locked_until) return false
  return new Date(account.locked_until).getTime() > Date.now()
}

/**
 * Pure : timestamp Unix (ms) de fin du verrouillage, ou null si pas verrouillé.
 * Utile pour calculer le temps restant côté UI (countdown).
 */
export function lockedUntilMs(account: RateLimitState): number | null {
  if (!account.locked_until) return null
  const ms = new Date(account.locked_until).getTime()
  return ms > Date.now() ? ms : null
}

/**
 * Incrémente le compteur d'échec. Si le seuil est atteint, verrouille le compte.
 *
 * Stratégie : lorsque le verrouillage est posé, le compteur est remis à 0
 * (le verrouillage lui-même est la punition). À l'expiration, l'admin
 * dispose à nouveau de ADMIN_MAX_FAILED_ATTEMPTS tentatives complètes.
 */
export async function applyFailedAttempt(adminId: string): Promise<{
  failed_attempts: number
  locked_until: string | null
  locked: boolean
}> {
  const supabase = createServiceRoleClient()

  const { data: current, error: selErr } = await supabase
    .from('admin_accounts')
    .select('failed_attempts')
    .eq('id', adminId)
    .single()

  if (selErr || !current) {
    throw new Error(
      `[rate-limit] admin_accounts introuvable : ${selErr?.message ?? 'aucune ligne'}`,
    )
  }

  const next = current.failed_attempts + 1
  const willLock = next >= ADMIN_MAX_FAILED_ATTEMPTS

  const locked_until = willLock
    ? new Date(Date.now() + ADMIN_LOCK_DURATION_MINUTES * 60 * 1000).toISOString()
    : null

  const failed_attempts = willLock ? 0 : next

  const { error: updErr } = await supabase
    .from('admin_accounts')
    .update({ failed_attempts, locked_until })
    .eq('id', adminId)

  if (updErr) {
    throw new Error(`[rate-limit] échec d'incrément : ${updErr.message}`)
  }

  return { failed_attempts, locked_until, locked: willLock }
}

/**
 * Reset après login réussi : compteur à 0, verrouillage levé, last_login_at posé.
 */
export async function resetAttempts(adminId: string): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('admin_accounts')
    .update({
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', adminId)

  if (error) {
    throw new Error(`[rate-limit] échec reset : ${error.message}`)
  }
}