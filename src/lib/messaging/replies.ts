import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Reponse JOUEUR -> admin.
 *
 * AUTORISEE uniquement si le message parent etait adresse a ce joueur ET porte
 * `allow_replies = true`. La verification est faite ICI cote serveur (ne jamais
 * se fier a l'UI) ; la policy RLS `messages_insert_reply` est une 2e barriere.
 *
 * La reponse n'a ni `recipient_player_id` ni `broadcast_scope` : la contrainte
 * `messages_routing` l'autorise via `sender_type='player' AND parent_message_id`.
 */
export interface CreateReplyArgs {
  playerId: string
  parentMessageId: string
  body: string
}

export type CreateReplyResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: 'parent_not_found' | 'reply_not_allowed' | 'db_error' }

export async function createPlayerReply(
  args: CreateReplyArgs,
): Promise<CreateReplyResult> {
  const supabase = createServiceRoleClient()

  const { data: parent, error: parentError } = await supabase
    .from('messages')
    .select('id, recipient_player_id, allow_replies, subject, tournament_id')
    .eq('id', args.parentMessageId)
    .maybeSingle()

  if (parentError) {
    console.error('[createPlayerReply:parent]', parentError.message)
    return { ok: false, reason: 'db_error' }
  }

  // Le parent doit exister ET avoir ete adresse a CE joueur.
  if (!parent || parent.recipient_player_id !== args.playerId) {
    return { ok: false, reason: 'parent_not_found' }
  }

  // Reponses controlees : refus serveur si non autorisees.
  if (!parent.allow_replies) {
    return { ok: false, reason: 'reply_not_allowed' }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_type: 'player',
      sender_player_id: args.playerId,
      parent_message_id: parent.id,
      tournament_id: parent.tournament_id,
      subject: `Re: ${parent.subject}`,
      body: args.body,
      allow_replies: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createPlayerReply:insert]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  return { ok: true, messageId: data.id }
}