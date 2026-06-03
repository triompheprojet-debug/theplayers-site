import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type ServiceClient = SupabaseClient<Database>

/**
 * Remise d'une inscription à `reserved` (M10).
 *
 * Appelée lors du rejet d'un paiement : la réservation reste valide, le joueur
 * peut resoumettre une preuve. Aucun badge n'a été attribué (l'inscription
 * n'a jamais été `confirmed`), donc rien à défaire côté numéro.
 *
 * Idempotent : si déjà `reserved`, renvoie ok sans rien écrire.
 * On ne remet PAS à reserved une inscription déjà `confirmed` (sécurité :
 * un rejet ne doit pas dé-confirmer un joueur déjà validé).
 */
export type RevertRegistrationResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'invalid_status' | 'db_error' }

export async function revertRegistrationToReserved(
  registrationId: string,
  client?: ServiceClient,
): Promise<RevertRegistrationResult> {
  const supabase = client ?? createServiceRoleClient()

  const { data: current, error: readError } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('id', registrationId)
    .maybeSingle()

  if (readError) {
    console.error('[revertRegistrationToReserved:read]', readError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!current) return { ok: false, reason: 'not_found' }

  if (current.status === 'reserved') return { ok: true } // idempotent

  // Seule une inscription en attente de vérification peut repasser à reserved.
  if (current.status !== 'awaiting_verification') {
    return { ok: false, reason: 'invalid_status' }
  }

  const { error: updateError } = await supabase
    .from('registrations')
    .update({ status: 'reserved' })
    .eq('id', registrationId)
    .eq('status', 'awaiting_verification')

  if (updateError) {
    console.error('[revertRegistrationToReserved:update]', updateError.message)
    return { ok: false, reason: 'db_error' }
  }

  return { ok: true }
}