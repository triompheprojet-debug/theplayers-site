import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type NotificationType = Database['public']['Enums']['notification_type']

/**
 * Dispatch GROUPE : une meme notification a plusieurs joueurs (service_role).
 * Pour des emissions de masse cote serveur (futurs rappels cron, annonces).
 * Une ligne `notifications` par destinataire.
 */
export interface DispatchArgs {
  playerIds: string[]
  type: NotificationType
  title: string
  body?: string
  tournamentId?: string | null
  actionUrl?: string | null
}

export type DispatchResult =
  | { ok: true; count: number }
  | { ok: false; reason: 'no_recipients' | 'db_error' }

export async function dispatchNotifications(
  args: DispatchArgs,
): Promise<DispatchResult> {
  const playerIds = Array.from(new Set(args.playerIds.filter(Boolean)))
  if (playerIds.length === 0) return { ok: false, reason: 'no_recipients' }

  const supabase = createServiceRoleClient()

  const rows = playerIds.map((pid) => ({
    player_id: pid,
    notification_type: args.type,
    title: args.title,
    body: args.body ?? null,
    tournament_id: args.tournamentId ?? null,
    action_url: args.actionUrl ?? null,
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) {
    console.error('[dispatchNotifications]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  return { ok: true, count: playerIds.length }
}