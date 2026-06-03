'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireAdmin } from '@/lib/auth/permissions'
import {
  confirmPayment,
  getProofSignedUrl,
  rejectPayment,
} from '@/lib/payments/verify'
import { ROUTES } from '@/config/routes'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

/**
 * Server Actions de la page "Paiements à traiter" (M10).
 *
 * Auth admin requise (requireAdmin → adminId). Délègue la logique métier à
 * `@/lib/payments/verify`. Revalide les pages impactées. Règle 9 : aucune
 * action de remboursement n'existe.
 */

const rejectReasonSchema = z
  .string({ error: 'Le motif est obligatoire.' })
  .trim()
  .min(5, { error: 'Le motif doit faire au moins 5 caractères.' })
  .max(500, { error: 'Le motif ne peut pas dépasser 500 caractères.' })

function revalidateAffected(): void {
  revalidatePath(ROUTES.admin.payments)
  revalidatePath(ROUTES.admin.dashboard)
  revalidatePath(ROUTES.admin.registrations.root)
  revalidatePath(ROUTES.admin.badgeNumbers)
}

export interface ConfirmPaymentOutput {
  badgeNumber: number | null
}

export async function confirmPaymentAction(
  paymentId: string,
): Promise<ActionResult<ConfirmPaymentOutput>> {
  const session = await requireAdmin()

  if (typeof paymentId !== 'string' || paymentId.length === 0) {
    return actionError('Paiement introuvable.')
  }

  const result = await confirmPayment(paymentId, session.adminId)
  if (!result.ok) {
    return actionError(confirmErrorMessage(result.reason))
  }

  revalidateAffected()
  return actionSuccess({ badgeNumber: result.badgeNumber })
}

export async function rejectPaymentAction(
  paymentId: string,
  rawReason: unknown,
): Promise<ActionResult<void>> {
  const session = await requireAdmin()

  if (typeof paymentId !== 'string' || paymentId.length === 0) {
    return actionError('Paiement introuvable.')
  }

  const parsed = rejectReasonSchema.safeParse(rawReason)
  if (!parsed.success) {
    return actionError('Motif invalide.', {
      reason: parsed.error.issues.map((i) => i.message),
    })
  }

  const result = await rejectPayment(paymentId, session.adminId, parsed.data)
  if (!result.ok) {
    return actionError(rejectErrorMessage(result.reason))
  }

  revalidateAffected()
  return actionSuccess(undefined)
}

export async function getProofUrlAction(
  paymentId: string,
): Promise<ActionResult<{ url: string | null }>> {
  await requireAdmin()

  if (typeof paymentId !== 'string' || paymentId.length === 0) {
    return actionError('Paiement introuvable.')
  }

  const url = await getProofSignedUrl(paymentId)
  return actionSuccess({ url })
}

// ---------------------------------------------------------------------------
// Traduction des codes métier en messages
// ---------------------------------------------------------------------------

function confirmErrorMessage(reason: string): string {
  switch (reason) {
    case 'not_found':
      return 'Ce paiement est introuvable.'
    case 'not_pending':
      return 'Ce paiement a déjà été traité.'
    default:
      return 'La confirmation a échoué. Réessaie.'
  }
}

function rejectErrorMessage(reason: string): string {
  switch (reason) {
    case 'not_found':
      return 'Ce paiement est introuvable.'
    case 'not_pending':
      return 'Ce paiement a déjà été traité.'
    default:
      return 'Le rejet a échoué. Réessaie.'
  }
}