import type {
  RealtimeChannel,
  SupabaseClient,
} from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

type TypedClient = SupabaseClient<Database>

/**
 * Forme d'une notification cote client (decouple des types generes pour ne pas
 * casser tant que `pnpm db:types` n'a pas integre la table `notifications`).
 */
export interface NotificationRealtime {
  id: string
  player_id: string
  notification_type: string
  title: string
  body: string | null
  tournament_id: string | null
  action_url: string | null
  read_at: string | null
  created_at: string
}

interface SubscribeHandlers {
  onInsert?: (row: NotificationRealtime) => void
  onUpdate?: (row: NotificationRealtime) => void
}

/**
 * Souscrit aux changements `notifications` du joueur (INSERT + UPDATE), filtres
 * cote serveur par `player_id`. Renvoie le canal (a retirer via
 * `supabase.removeChannel(channel)` au cleanup). Pur navigateur.
 */
export function subscribeToNotifications(
  supabase: TypedClient,
  playerId: string,
  handlers: SubscribeHandlers,
): RealtimeChannel {
  return supabase
    .channel(`notifications:${playerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `player_id=eq.${playerId}`,
      },
      (payload) => handlers.onInsert?.(payload.new as NotificationRealtime),
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `player_id=eq.${playerId}`,
      },
      (payload) => handlers.onUpdate?.(payload.new as NotificationRealtime),
    )
    .subscribe()
}