import 'server-only'

import { logActivity } from '@/lib/activity/log'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Envoi UNITAIRE d'un message admin -> joueur.
 *
 * Ecriture en service_role (admin = auth custom, hors RLS). La couche
 * Server Action (Etape 2) valide les entrees et traduit le `reason` en message
 * utilisateur. On journalise l'envoi (`activity_log.metadata`).
 */
export interface SendMessageArgs {
  senderAdminId: string
  recipientPlayerId: string
  subject: string
  body: string
  allowReplies?: boolean
  /** Contexte tournoi facultatif (etancheite Regle 12 si fourni). */
  tournamentId?: string | null
}

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: 'db_error' }

export async function sendMessage(
  args: SendMessageArgs,
): Promise<SendMessageResult> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_type: 'admin',
      sender_admin_id: args.senderAdminId,
      recipient_player_id: args.recipientPlayerId,
      subject: args.subject,
      body: args.body,
      allow_replies: args.allowReplies ?? false,
      tournament_id: args.tournamentId ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[sendMessage]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  await logActivity({
    adminId: args.senderAdminId,
    actionType: 'send_message',
    targetTable: 'messages',
    targetId: data.id,
    description: `Message envoye a un joueur : ${args.subject}`,
    metadata: {
      recipientPlayerId: args.recipientPlayerId,
      allowReplies: args.allowReplies ?? false,
    },
  })

  return { ok: true, messageId: data.id }
}