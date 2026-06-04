import 'server-only'

import { logActivity } from '@/lib/activity/log'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import type { Database } from '@/types/database.types'

type RegistrationStatus = Database['public']['Enums']['registration_status']

/**
 * Envoi GROUPE (broadcast) admin -> joueurs du TOURNOI ACTIF (etancheite,
 * Regle 12). Une ligne `messages` par destinataire (decision B) : plus simple
 * a requeter cote joueur (RLS `recipient_player_id = auth.uid()`).
 *
 * La capacite n'est jamais lue ni exposee ici (Regle 1) : on ne fait que
 * resoudre la liste des joueurs selon leur statut d'inscription.
 */
export type BroadcastScope = 'all_confirmed' | 'all_registered'

export interface BroadcastArgs {
  senderAdminId: string
  scope: BroadcastScope
  subject: string
  body: string
  allowReplies?: boolean
}

export type BroadcastResult =
  | { ok: true; recipientCount: number; tournamentId: string }
  | {
      ok: false
      reason: 'no_active_tournament' | 'no_recipients' | 'db_error'
    }

const STATUSES_BY_SCOPE: Record<BroadcastScope, readonly RegistrationStatus[]> =
  {
    all_confirmed: ['confirmed'],
    all_registered: ['reserved', 'awaiting_verification', 'confirmed'],
  }

export async function broadcastMessage(
  args: BroadcastArgs,
): Promise<BroadcastResult> {
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) return { ok: false, reason: 'no_active_tournament' }

  const supabase = createServiceRoleClient()

  // Destinataires : joueurs distincts du tournoi actif selon le scope.
  const { data: regs, error: regError } = await supabase
    .from('registrations')
    .select('player_id')
    .eq('tournament_id', tournament.id)
    .in('status', STATUSES_BY_SCOPE[args.scope])

  if (regError) {
    console.error('[broadcastMessage:recipients]', regError.message)
    return { ok: false, reason: 'db_error' }
  }

  const playerIds = Array.from(
    new Set((regs ?? []).map((r) => r.player_id).filter(Boolean) as string[]),
  )
  if (playerIds.length === 0) return { ok: false, reason: 'no_recipients' }

  // Une ligne par destinataire (decision B).
  const rows = playerIds.map((pid) => ({
    sender_type: 'admin' as const,
    sender_admin_id: args.senderAdminId,
    recipient_player_id: pid,
    broadcast_scope: args.scope,
    tournament_id: tournament.id,
    subject: args.subject,
    body: args.body,
    allow_replies: args.allowReplies ?? false,
  }))

  const { error: insertError } = await supabase.from('messages').insert(rows)
  if (insertError) {
    console.error('[broadcastMessage:insert]', insertError.message)
    return { ok: false, reason: 'db_error' }
  }

  await logActivity({
    adminId: args.senderAdminId,
    actionType: 'broadcast_message',
    targetTable: 'messages',
    description: `Broadcast a ${playerIds.length} joueur(s) : ${args.subject}`,
    metadata: {
      scope: args.scope,
      recipientCount: playerIds.length,
      tournamentId: tournament.id,
      allowReplies: args.allowReplies ?? false,
    },
  })

  return {
    ok: true,
    recipientCount: playerIds.length,
    tournamentId: tournament.id,
  }
}