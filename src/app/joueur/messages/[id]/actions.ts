'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { ROUTES } from '@/config/routes'
import { createPlayerReply } from '@/lib/messaging/replies'
import { createClient } from '@/lib/supabase/server'
import { replySchema } from '@/lib/validation/message'

import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

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
 * Reponse du joueur a un message. Le serveur reverifie l'autorisation
 * (`allow_replies` du parent) et le quota (2 reponses depuis le dernier message
 * admin) dans `createPlayerReply` (la RLS + le trigger DB sont les barrieres dures).
 */
export async function replyAction(raw: {
  parentMessageId: string
  body: string
}): Promise<ActionResult<{ messageId: string }>> {
  const parsed = replySchema.safeParse(raw)
  if (!parsed.success) {
    return actionError('Donnees invalides', toFieldErrors(parsed.error))
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return actionError('Session expiree, reconnecte-toi.')

  const result = await createPlayerReply({
    playerId: user.id,
    parentMessageId: parsed.data.parentMessageId,
    body: parsed.data.body,
  })

  if (!result.ok) {
    const message =
      result.reason === 'reply_not_allowed'
        ? 'Les reponses ne sont pas autorisees pour ce message.'
        : result.reason === 'reply_limit_reached'
          ? "Tu as deja utilise tes 2 reponses. Attends que l'admin relance la discussion."
          : result.reason === 'parent_not_found'
            ? 'Message introuvable.'
            : "L'envoi a echoue, reessaie."
    return actionError(message)
  }

  revalidatePath(ROUTES.player.messageDetail(parsed.data.parentMessageId))
  revalidatePath(ROUTES.player.messages)
  return actionSuccess({ messageId: result.messageId })
}