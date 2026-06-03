import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type ServiceClient = SupabaseClient<Database>

/**
 * Confirmation d'une inscription (M10).
 *
 * Passe `registrations.status` à `confirmed` via UPDATE. Le badge est
 * attribué AUTOMATIQUEMENT par le trigger `trg_registrations_assign_badge`
 * (AFTER UPDATE, condition `status='confirmed' AND OLD.status <> 'confirmed'`).
 * On ne touche JAMAIS `badge_number` à la main (Règle métier M08/M10).
 *
 * Idempotent : si déjà `confirmed`, renvoie le badge existant sans rien écrire.
 *
 * Le client service_role peut être injecté (réutilisé par confirmPayment /
 * createManualRegistration pour partager une seule instance).
 */
export type ConfirmRegistrationResult =
  | { ok: true; badgeNumber: number | null }
  | { ok: false; reason: 'not_found' | 'invalid_status' | 'db_error' }

const CONFIRMABLE_STATUSES = ['reserved', 'awaiting_verification'] as const

export async function confirmRegistration(
  registrationId: string,
  client?: ServiceClient,
): Promise<ConfirmRegistrationResult> {
  const supabase = client ?? createServiceRoleClient()

  // État courant
  const { data: current, error: readError } = await supabase
    .from('registrations')
    .select('id, status, badge_number')
    .eq('id', registrationId)
    .maybeSingle()

  if (readError) {
    console.error('[confirmRegistration:read]', readError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!current) return { ok: false, reason: 'not_found' }

  // Déjà confirmée → idempotent
  if (current.status === 'confirmed') {
    return { ok: true, badgeNumber: current.badge_number }
  }

  // Seuls reserved / awaiting_verification sont confirmables
  if (!CONFIRMABLE_STATUSES.includes(current.status as never)) {
    return { ok: false, reason: 'invalid_status' }
  }

  // UPDATE → déclenche le trigger d'attribution de badge.
  const { error: updateError } = await supabase
    .from('registrations')
    .update({ status: 'confirmed' })
    .eq('id', registrationId)
    .in('status', [...CONFIRMABLE_STATUSES])

  if (updateError) {
    console.error('[confirmRegistration:update]', updateError.message)
    return { ok: false, reason: 'db_error' }
  }

  // Le badge est posé par le trigger AFTER UPDATE (sous-UPDATE) : on relit.
  const { data: refreshed } = await supabase
    .from('registrations')
    .select('badge_number')
    .eq('id', registrationId)
    .maybeSingle()

  return { ok: true, badgeNumber: refreshed?.badge_number ?? null }
}