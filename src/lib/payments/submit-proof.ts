import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { PaymentProofOutput } from '@/lib/validation/payment'

const BUCKET = 'payment-proofs'
const MAX_BYTES = 5 * 1024 * 1024 // 5 Mo (aligné sur le bucket)
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const

export type SubmitProofResult =
  | { ok: true; paymentId: string }
  | {
      ok: false
      reason:
        | 'registration_not_found'
        | 'not_owner'
        | 'invalid_file'
        | 'file_too_large'
        | 'duplicate_ref'
        | 'upload_error'
        | 'db_error'
    }

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

/**
 * Soumet une preuve de paiement :
 *   1. Vérifie que la réservation appartient au joueur.
 *   2. Valide le fichier (MIME + taille) — défense en profondeur côté serveur.
 *   3. Upload dans le bucket PRIVÉ (chemin {player_id}/{registration_id}/{uuid}.ext).
 *   4. Insère la ligne payments (pending) avec tournament_id dénormalisé.
 *   5. Fait passer la réservation reserved → awaiting_verification.
 *   6. Rollback de l'upload si l'insert échoue (cohérence logique).
 *
 * service_role : la vérification de propriété et la dénormalisation du
 * tournament_id nécessitent une lecture fiable de registrations.
 */
export async function submitPaymentProof(
  playerId: string,
  input: PaymentProofOutput,
  file: File | null,
): Promise<SubmitProofResult> {
  const supabase = createServiceRoleClient()

  // 1. Réservation → vérif propriété + récup tournament_id
  const { data: reg, error: regError } = await supabase
    .from('registrations')
    .select('id, player_id, tournament_id, status')
    .eq('id', input.registrationId)
    .maybeSingle()

  if (regError) {
    console.error('[submitPaymentProof:reg]', regError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!reg) return { ok: false, reason: 'registration_not_found' }
  if (reg.player_id !== playerId) return { ok: false, reason: 'not_owner' }

  // 2. Validation fichier (obligatoire pour mobile money ; toléré absent pour cash)
  let storagePath: string | null = null
  if (file && file.size > 0) {
    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
      return { ok: false, reason: 'invalid_file' }
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, reason: 'file_too_large' }
    }

    // 3. Upload — chemin préfixé par player_id (cohérent avec la policy Storage)
    const uuid = crypto.randomUUID()
    const path = `${playerId}/${reg.id}/${uuid}.${extFromMime(file.type)}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[submitPaymentProof:upload]', uploadError.message)
      return { ok: false, reason: 'upload_error' }
    }
    storagePath = path
  }

  // 4. Insert payment (pending)
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      registration_id: reg.id,
      tournament_id: reg.tournament_id,
      player_id: playerId,
      method: input.method,
      amount_fcfa: input.amountFcfa,
      sender_phone: input.senderPhone ?? null,
      sender_name: input.senderName ?? null,
      time_slot: input.timeSlot ?? null,
      transaction_ref: input.transactionRef ?? null,
      proof_file_url: storagePath,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError) {
    // Rollback de l'upload si l'insert échoue
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath])
    }
    if (insertError.code === '23505') {
      return { ok: false, reason: 'duplicate_ref' }
    }
    console.error('[submitPaymentProof:insert]', insertError.message)
    return { ok: false, reason: 'db_error' }
  }

  // 5. Réservation → awaiting_verification (uniquement depuis reserved)
  if (reg.status === 'reserved') {
    const { error: updError } = await supabase
      .from('registrations')
      .update({ status: 'awaiting_verification' })
      .eq('id', reg.id)
      .eq('status', 'reserved')

    if (updError) {
      // Le paiement est créé ; on log sans annuler (l'admin verra la preuve).
      console.error('[submitPaymentProof:regUpdate]', updError.message)
    }
  }

  return { ok: true, paymentId: payment.id }
}

/**
 * Récupère le dernier paiement du joueur pour une réservation (statut bandeau).
 */
export async function getLatestPaymentForRegistration(
  playerId: string,
  registrationId: string,
): Promise<{
  id: string
  status: string
  method: string
  rejection_reason: string | null
} | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('payments')
    .select('id, status, method, rejection_reason, player_id')
    .eq('registration_id', registrationId)
    .eq('player_id', playerId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getLatestPaymentForRegistration]', error.message)
    return null
  }
  if (!data) return null
  return {
    id: data.id,
    status: data.status,
    method: data.method,
    rejection_reason: data.rejection_reason,
  }
}

/**
 * Résumé d'un paiement, exposé au JOUEUR (jamais internal_note ni verified_by).
 */
export interface PlayerPaymentSummary {
  id: string
  method: string
  amount_fcfa: number
  status: string
  rejection_reason: string | null
  transaction_ref: string | null
  submitted_at: string
}

/**
 * Liste TOUS les paiements du joueur pour une réservation (historique),
 * du plus récent au plus ancien. Champs publics joueur uniquement.
 */
export async function listPaymentsForRegistration(
  playerId: string,
  registrationId: string,
): Promise<PlayerPaymentSummary[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      'id, method, amount_fcfa, status, rejection_reason, transaction_ref, submitted_at',
    )
    .eq('registration_id', registrationId)
    .eq('player_id', playerId)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('[listPaymentsForRegistration]', error.message)
    return []
  }
  return (data ?? []) as PlayerPaymentSummary[]
}