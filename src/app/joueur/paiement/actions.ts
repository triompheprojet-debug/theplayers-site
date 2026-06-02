'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { ROUTES } from '@/config/routes'
import { submitPaymentProof as submitProofLogic } from '@/lib/payments/submit-proof'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { paymentProofSchema } from '@/lib/validation/payment'
import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const flat = z.flattenError(error)
  const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>
  const out: Record<string, string[]> = {}
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) out[key] = messages
  }
  return out
}

/**
 * Soumet une preuve de paiement pour la réservation du joueur.
 *
 * Reçoit un `FormData` (Next 16 supporte `File` dans les Server Actions) :
 *   - registrationId, method, amountFcfa, senderPhone?, senderName?,
 *     timeSlot?, transactionRef?
 *   - proof : le fichier (capture) — optionnel pour cash.
 *
 * Flux : auth → rate-limit (par user) → validation Zod → logique métier
 * (vérif propriété + upload + insert + maj réservation). ActionResult.
 */
export async function submitPaymentProof(
  formData: FormData,
): Promise<ActionResult<{ paymentId: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return actionError('Session expirée. Reconnecte-toi.')

  const allowed = await checkRateLimit('paymentProof', user.id)
  if (!allowed) {
    return actionError('Trop de soumissions. Réessaie dans quelques minutes.')
  }

  // Champs texte → objet validé
  const raw = {
    registrationId: String(formData.get('registrationId') ?? ''),
    method: String(formData.get('method') ?? ''),
    amountFcfa: Number(formData.get('amountFcfa') ?? 0),
    senderPhone: (formData.get('senderPhone') as string) ?? undefined,
    senderName: (formData.get('senderName') as string) ?? undefined,
    timeSlot: (formData.get('timeSlot') as string) ?? undefined,
    transactionRef: (formData.get('transactionRef') as string) ?? undefined,
  }

  const parsed = paymentProofSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError(
      'Veuillez corriger les champs en surbrillance.',
      toFieldErrors(parsed.error),
    )
  }

  // Fichier (peut être absent pour cash)
  const fileEntry = formData.get('proof')
  const file = fileEntry instanceof File ? fileEntry : null

  // Mobile money : capture obligatoire
  if (parsed.data.method !== 'cash' && (!file || file.size === 0)) {
    return actionError('La capture du paiement est obligatoire.', {
      proof: ['Ajoute une capture d\'écran du paiement.'],
    })
  }

  const result = await submitProofLogic(user.id, parsed.data, file)

  if (!result.ok) {
    switch (result.reason) {
      case 'registration_not_found':
        return actionError('Réservation introuvable.')
      case 'not_owner':
        return actionError("Cette réservation ne t'appartient pas.")
      case 'invalid_file':
        return actionError('Format de fichier non accepté (JPEG, PNG ou WebP).', {
          proof: ['Format non accepté (JPEG, PNG ou WebP).'],
        })
      case 'file_too_large':
        return actionError('Fichier trop volumineux (5 Mo maximum).', {
          proof: ['Fichier trop volumineux (5 Mo maximum).'],
        })
      case 'duplicate_ref':
        return actionError('Cette référence de transaction a déjà été soumise.', {
          transactionRef: ['Cette référence a déjà été soumise.'],
        })
      case 'upload_error':
        return actionError("L'envoi de la capture a échoué. Réessaie.")
      default:
        return actionError('La soumission a échoué. Réessaie.')
    }
  }

  revalidatePath(ROUTES.player.payment)
  revalidatePath(ROUTES.player.dashboard)
  return actionSuccess({ paymentId: result.paymentId })
}