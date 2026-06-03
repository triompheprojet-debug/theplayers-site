import 'server-only'

import { logActivity } from '@/lib/activity/log'
import { confirmRegistration } from '@/lib/registrations/confirm'
import { revertRegistrationToReserved } from '@/lib/registrations/reject'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type PaymentMethod = Database['public']['Enums']['payment_method']

const PROOF_BUCKET = 'payment-proofs'
const PROOF_URL_TTL_SECONDS = 300 // aperçu privé court (Règle preuves)

/**
 * Vérification des preuves de paiement par l'admin (M10).
 *
 * - confirmPayment : paiement → confirmed, inscription → confirmed (badge auto).
 * - rejectPayment  : paiement → rejected (+ motif), inscription → reserved.
 * - listPendingPayments / getPendingPaymentsCount : file d'attente.
 * - getProofSignedUrl : aperçu privé temporaire de la preuve.
 *
 * Tout en service_role (admin = auth custom, RLS bloquante). Aucune notion
 * de remboursement (Règle 9). Le badge n'est JAMAIS écrit à la main : il est
 * posé par le trigger sur passage de l'inscription à `confirmed`.
 *
 * Ordre des écritures pensé pour la ré-exécution : on agit d'abord sur
 * l'inscription (idempotente), puis sur le paiement (gardé par `status`),
 * pour qu'un nouvel essai après échec partiel reste possible.
 */

// ---------------------------------------------------------------------------
// File d'attente
// ---------------------------------------------------------------------------

export interface PendingPaymentRow {
  id: string
  registrationId: string
  playerId: string
  pseudo: string
  phone: string
  method: PaymentMethod
  amountFcfa: number
  senderPhone: string | null
  senderName: string | null
  transactionRef: string | null
  hasProof: boolean
  submittedAt: string
}

export async function listPendingPayments(
  tournamentId: string,
): Promise<PendingPaymentRow[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('payments')
    .select(
      `id, registration_id, player_id, method, amount_fcfa,
       sender_phone, sender_name, transaction_ref, proof_file_url, submitted_at,
       profiles!payments_player_id_fkey ( pseudo, phone )`,
    )
    .eq('tournament_id', tournamentId)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  if (error) {
    console.error('[listPendingPayments]', error.message)
    return []
  }

  return (data ?? []).map((p) => {
    const profile = p.profiles as unknown as {
      pseudo: string
      phone: string
    } | null
    return {
      id: p.id,
      registrationId: p.registration_id,
      playerId: p.player_id,
      pseudo: profile?.pseudo ?? '—',
      phone: profile?.phone ?? '',
      method: p.method,
      amountFcfa: p.amount_fcfa,
      senderPhone: p.sender_phone,
      senderName: p.sender_name,
      transactionRef: p.transaction_ref,
      hasProof: Boolean(p.proof_file_url),
      submittedAt: p.submitted_at,
    }
  })
}

export async function getPendingPaymentsCount(
  tournamentId: string,
): Promise<number> {
  const supabase = createServiceRoleClient()
  const { count, error } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('status', 'pending')

  if (error) {
    console.error('[getPendingPaymentsCount]', error.message)
    return 0
  }
  return count ?? 0
}

/**
 * Aperçu privé de la preuve : URL signée courte durée (jamais public).
 * Hypothèse : `payments.proof_file_url` contient le CHEMIN d'objet dans le
 * bucket privé `payment-proofs` (cohérent avec l'upload M09).
 */
export async function getProofSignedUrl(
  paymentId: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient()

  const { data: payment, error } = await supabase
    .from('payments')
    .select('proof_file_url')
    .eq('id', paymentId)
    .maybeSingle()

  if (error || !payment?.proof_file_url) return null

  const { data: signed, error: signError } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(payment.proof_file_url, PROOF_URL_TTL_SECONDS)

  if (signError) {
    console.error('[getProofSignedUrl]', signError.message)
    return null
  }
  return signed?.signedUrl ?? null
}

// ---------------------------------------------------------------------------
// Confirmation
// ---------------------------------------------------------------------------

export type ConfirmPaymentResult =
  | { ok: true; badgeNumber: number | null }
  | { ok: false; reason: 'not_found' | 'not_pending' | 'db_error' }

export async function confirmPayment(
  paymentId: string,
  adminId: string,
): Promise<ConfirmPaymentResult> {
  const supabase = createServiceRoleClient()

  const { data: payment, error: readError } = await supabase
    .from('payments')
    .select('id, status, registration_id, player_id, method, amount_fcfa')
    .eq('id', paymentId)
    .maybeSingle()

  if (readError) {
    console.error('[confirmPayment:read]', readError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!payment) return { ok: false, reason: 'not_found' }
  if (payment.status !== 'pending') return { ok: false, reason: 'not_pending' }

  // 1. Inscription → confirmed (idempotent, badge posé par trigger)
  const reg = await confirmRegistration(payment.registration_id, supabase)
  if (!reg.ok) {
    console.error('[confirmPayment:registration]', reg.reason)
    return { ok: false, reason: 'db_error' }
  }

  // 2. Paiement → confirmed (gardé sur status='pending')
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      verified_at: new Date().toISOString(),
      verified_by: adminId,
    })
    .eq('id', paymentId)
    .eq('status', 'pending')

  if (updateError) {
    console.error('[confirmPayment:update]', updateError.message)
    return { ok: false, reason: 'db_error' }
  }

  await logActivity({
    adminId,
    actionType: 'payment_confirmed',
    targetTable: 'payments',
    targetId: paymentId,
    description: `Paiement confirmé (badge ${reg.badgeNumber ?? '—'}).`,
    metadata: {
      registration_id: payment.registration_id,
      player_id: payment.player_id,
      method: payment.method,
      amount_fcfa: payment.amount_fcfa,
      badge_number: reg.badgeNumber,
    },
  })

  return { ok: true, badgeNumber: reg.badgeNumber }
}

// ---------------------------------------------------------------------------
// Rejet
// ---------------------------------------------------------------------------

export type RejectPaymentResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'not_pending' | 'db_error' }

export async function rejectPayment(
  paymentId: string,
  adminId: string,
  reason: string,
): Promise<RejectPaymentResult> {
  const supabase = createServiceRoleClient()

  const { data: payment, error: readError } = await supabase
    .from('payments')
    .select('id, status, registration_id, player_id, method')
    .eq('id', paymentId)
    .maybeSingle()

  if (readError) {
    console.error('[rejectPayment:read]', readError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!payment) return { ok: false, reason: 'not_found' }
  if (payment.status !== 'pending') return { ok: false, reason: 'not_pending' }

  // 1. Inscription → reserved (idempotent) : le joueur pourra resoumettre.
  const reverted = await revertRegistrationToReserved(
    payment.registration_id,
    supabase,
  )
  if (!reverted.ok) {
    console.error('[rejectPayment:registration]', reverted.reason)
    return { ok: false, reason: 'db_error' }
  }

  // 2. Paiement → rejected (+ motif obligatoire)
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      verified_at: new Date().toISOString(),
      verified_by: adminId,
    })
    .eq('id', paymentId)
    .eq('status', 'pending')

  if (updateError) {
    console.error('[rejectPayment:update]', updateError.message)
    return { ok: false, reason: 'db_error' }
  }

  await logActivity({
    adminId,
    actionType: 'payment_rejected',
    targetTable: 'payments',
    targetId: paymentId,
    description: 'Preuve de paiement rejetée.',
    metadata: {
      registration_id: payment.registration_id,
      player_id: payment.player_id,
      method: payment.method,
      reason,
    },
  })

  return { ok: true }
}