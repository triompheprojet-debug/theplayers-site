import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Marquage « lu » cote SERVEUR (service_role) — pour usages serveur/futurs.
 *
 * NB : dans l'espace joueur, le marquage se fait cote client via le client
 * navigateur (RLS `notifications_update_read` + trigger `protect_notification_columns`
 * qui n'autorise que `read_at`). Ces helpers servent aux Server Actions/cron.
 * On scoppe toujours par `playerId` (jamais marquer la notif d'un autre joueur).
 */
export async function markNotificationRead(
  notificationId: string,
  playerId: string,
): Promise<{ ok: boolean }> {
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('player_id', playerId)
    .is('read_at', null)

  if (error) {
    console.error('[markNotificationRead]', error.message)
    return { ok: false }
  }
  return { ok: true }
}

export async function markAllNotificationsRead(
  playerId: string,
): Promise<{ ok: boolean }> {
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('player_id', playerId)
    .is('read_at', null)

  if (error) {
    console.error('[markAllNotificationsRead]', error.message)
    return { ok: false }
  }
  return { ok: true }
}