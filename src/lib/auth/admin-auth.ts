/**
 * Vérification des identifiants admin (M02).
 *
 * Cœur du système d'auth : récupération du compte par username via
 * service_role (bypass RLS), vérification bcrypt du PIN, gestion du
 * rate-limit en cas d'échec.
 *
 * Sécurité : on ne distingue JAMAIS publiquement un username inexistant
 * d'un compte désactivé d'un PIN incorrect — tous renvoient le même
 * `invalid_credentials`. Seul un verrouillage actif est signalé (utile
 * pour afficher un countdown à l'admin légitime).
 */
import 'server-only'

import bcrypt from 'bcryptjs'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { applyFailedAttempt, isLocked, resetAttempts } from './rate-limit'

import type { Database } from '@/types/database.types'

type AdminRole = Database['public']['Enums']['admin_role']

/**
 * Identité minimale renvoyée après login réussi.
 * Le pin_hash n'est JAMAIS exposé hors de ce fichier.
 */
export interface AdminAccountIdentity {
  id: string
  username: string
  display_name: string
  role: AdminRole
}

/**
 * Résultat discriminé de la vérification.
 *
 * Côté UI (Server Action de M02.E), tous les `ok: false` non-lockés
 * doivent rendre le même message générique "Identifiants incorrects".
 * Seuls `account_locked` et `lockout_just_triggered` peuvent afficher
 * le temps restant.
 */
export type VerifyAdminCredentialsResult =
  | { ok: true; account: AdminAccountIdentity }
  | {
      ok: false
      reason: 'invalid_credentials' | 'account_locked' | 'lockout_just_triggered'
      lockedUntil?: string
    }

/**
 * Vérifie un couple (username, pin) contre la table admin_accounts.
 *
 * Cas gérés :
 *   - username inexistant       → invalid_credentials (silencieux)
 *   - compte désactivé          → invalid_credentials (silencieux)
 *   - compte verrouillé en cours → account_locked + lockedUntil
 *   - PIN incorrect             → invalid_credentials ou lockout_just_triggered
 *   - PIN correct               → ok + account (reset attempts + last_login_at)
 */
export async function verifyAdminCredentials(
  username: string,
  pin: string,
): Promise<VerifyAdminCredentialsResult> {
  const supabase = createServiceRoleClient()

  const { data: account, error } = await supabase
    .from('admin_accounts')
    .select(
      'id, username, display_name, role, pin_hash, is_active, failed_attempts, locked_until',
    )
    .eq('username', username)
    .maybeSingle()

  // username inexistant — message générique pour ne pas révéler les comptes existants
  if (error || !account) {
    // bcrypt.compare en blanc pour éviter le timing-attack qui détecterait
    // un username inexistant (réponse instantanée) vs valide (compare ~80ms).
    await bcrypt.compare(pin, '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsalt')
    return { ok: false, reason: 'invalid_credentials' }
  }

  // compte désactivé — silencieux par sécurité (Règle 8 / skill M02 test 6)
  if (!account.is_active) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  // compte actuellement verrouillé
  if (isLocked(account)) {
    return {
      ok: false,
      reason: 'account_locked',
      lockedUntil: account.locked_until!,
    }
  }

  // vérification bcrypt du PIN
  const pinOk = await bcrypt.compare(pin, account.pin_hash)

  if (!pinOk) {
    const { locked, locked_until } = await applyFailedAttempt(account.id)
    if (locked && locked_until) {
      return {
        ok: false,
        reason: 'lockout_just_triggered',
        lockedUntil: locked_until,
      }
    }
    return { ok: false, reason: 'invalid_credentials' }
  }

  // succès : reset compteur, locked_until, last_login_at
  await resetAttempts(account.id)

  return {
    ok: true,
    account: {
      id: account.id,
      username: account.username,
      display_name: account.display_name,
      role: account.role,
    },
  }
}