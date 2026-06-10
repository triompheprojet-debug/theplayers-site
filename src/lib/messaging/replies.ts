import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Reponse JOUEUR -> admin.
 *
 * AUTORISEE uniquement si le message parent etait adresse a ce joueur ET porte
 * `allow_replies = true`. Verifie ICI cote serveur (ne jamais se fier a l'UI) ;
 * la policy RLS `messages_insert_reply` est une 2e barriere.
 *
 * QUOTA : au plus 2 reponses joueur par message admin, decomptees depuis le
 * DERNIER message admin du fil (racine, ou relance admin in-thread). Des qu'un
 * nouveau message admin arrive, le repere avance et le quota se reinitialise.
 * Barriere dure : trigger DB `trg_enforce_player_reply_limit` (couvre les courses
 * concurrentes). Ici on verifie avant pour renvoyer un motif propre a l'UI.
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
  | {
      ok: false
      reason:
        | 'parent_not_found'
        | 'reply_not_allowed'
        | 'reply_limit_reached'
        | 'db_error'
    }

const REPLY_LIMIT = 2

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

  // --- Quota : 2 reponses depuis le dernier message admin du fil. ---
  const { data: lastAdmin, error: lastAdminError } = await supabase
    .from('messages')
    .select('sent_at')
    .or(`id.eq.${parent.id},parent_message_id.eq.${parent.id}`)
    .eq('sender_type', 'admin')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastAdminError) {
    console.error('[createPlayerReply:cutoff]', lastAdminError.message)
    return { ok: false, reason: 'db_error' }
  }

  const cutoff = lastAdmin?.sent_at ?? '1970-01-01T00:00:00Z'

  const { count, error: countError } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('parent_message_id', parent.id)
    .eq('sender_type', 'player')
    .gt('sent_at', cutoff)

  if (countError) {
    console.error('[createPlayerReply:count]', countError.message)
    return { ok: false, reason: 'db_error' }
  }

  if ((count ?? 0) >= REPLY_LIMIT) {
    return { ok: false, reason: 'reply_limit_reached' }
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
    // Le trigger DB peut refuser une course concurrente -> motif propre.
    if (error.message.includes('reply_limit_reached')) {
      return { ok: false, reason: 'reply_limit_reached' }
    }
    console.error('[createPlayerReply:insert]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  return { ok: true, messageId: data.id }
}