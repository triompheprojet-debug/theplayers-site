'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { ROUTES } from '@/config/routes'
import { requireAdminRole } from '@/lib/auth/permissions'
import { broadcastMessage } from '@/lib/messaging/broadcast'
import { sendMessage } from '@/lib/messaging/send'
import {
  broadcastSchema,
  sendMessageSchema,
  type BroadcastInput,
  type SendMessageInput,
} from '@/lib/validation/message'

import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

const MESSAGING_ROLES = ['super_admin', 'admin'] as const

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const flat = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >
  const out: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(flat)) {
    if (value && value.length > 0) out[key] = value
  }
  return out
}

/**
 * Envoi UNITAIRE admin -> un joueur.
 */
export async function sendMessageAction(
  raw: SendMessageInput,
): Promise<ActionResult<{ messageId: string }>> {
  const session = await requireAdminRole(MESSAGING_ROLES)

  const parsed = sendMessageSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError('Donnees invalides', toFieldErrors(parsed.error))
  }

  const result = await sendMessage({
    senderAdminId: session.adminId,
    recipientPlayerId: parsed.data.recipientPlayerId,
    subject: parsed.data.subject,
    body: parsed.data.body,
    allowReplies: parsed.data.allowReplies,
  })

  if (!result.ok) {
    return actionError("L'envoi a echoue, reessaie.")
  }

  revalidatePath(ROUTES.admin.messaging.root)
  return actionSuccess({ messageId: result.messageId })
}

/**
 * Envoi GROUPE (broadcast) aux joueurs du tournoi actif selon le scope.
 */
export async function broadcastMessageAction(
  raw: BroadcastInput,
): Promise<ActionResult<{ recipientCount: number }>> {
  const session = await requireAdminRole(MESSAGING_ROLES)

  const parsed = broadcastSchema.safeParse(raw)
  if (!parsed.success) {
    return actionError('Donnees invalides', toFieldErrors(parsed.error))
  }

  const result = await broadcastMessage({
    senderAdminId: session.adminId,
    scope: parsed.data.scope,
    subject: parsed.data.subject,
    body: parsed.data.body,
    allowReplies: parsed.data.allowReplies,
  })

  if (!result.ok) {
    const message =
      result.reason === 'no_active_tournament'
        ? 'Aucun tournoi actif pour diffuser un message.'
        : result.reason === 'no_recipients'
          ? 'Aucun destinataire ne correspond a ce critere.'
          : "La diffusion a echoue, reessaie."
    return actionError(message)
  }

  revalidatePath(ROUTES.admin.messaging.root)
  return actionSuccess({ recipientCount: result.recipientCount })
}