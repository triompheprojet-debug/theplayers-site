import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database, Json } from '@/types/database.types'

type NotificationType = Database['public']['Enums']['notification_type']

/**
 * Creation d'une notification (service_role). Utilise pour les emissions
 * PROGRAMMATIQUES cote serveur (modules futurs : cron, rappels, etc.).
 *
 * NB : les notifications standard (paiement confirme/rejete, badge pret,
 * message admin) sont emises par TRIGGERS SQL (cf. 13_create_notifications.sql),
 * donc pas besoin d'appeler cette fonction depuis M10/M11/M12.
 */
export interface CreateNotificationArgs {
  playerId: string
  type: NotificationType
  title: string
  body?: string
  tournamentId?: string | null
  payload?: Json | null
  actionUrl?: string | null
}

export type CreateNotificationResult =
  | { ok: true; notificationId: string }
  | { ok: false; reason: 'db_error' }

export async function createNotification(
  args: CreateNotificationArgs,
): Promise<CreateNotificationResult> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      player_id: args.playerId,
      notification_type: args.type,
      title: args.title,
      body: args.body ?? null,
      tournament_id: args.tournamentId ?? null,
      payload: args.payload ?? null,
      action_url: args.actionUrl ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createNotification]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  return { ok: true, notificationId: data.id }
}