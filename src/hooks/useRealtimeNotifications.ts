'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  subscribeToNotifications,
  type NotificationRealtime,
} from '@/lib/realtime/notifications-channel'

const PAGE_SIZE = 30

export interface UseRealtimeNotifications {
  items: NotificationRealtime[]
  unreadCount: number
  isLoading: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

/**
 * Notifications du joueur connecte, en temps reel.
 *
 * - Fetch initial (RLS `notifications_select_own`) puis souscription Realtime.
 * - AUCUN `setState` synchrone dans l'effet (regle `react-hooks/set-state-in-effect`) :
 *   les mises a jour ne se font que dans des callbacks async (`.then`), des handlers
 *   Realtime, ou des gestionnaires d'evenement. L'etat « vide » / « chargement »
 *   est DERIVE de `playerId` + `fetchedFor`, pas pose par `setState`.
 * - A consommer via `RealtimeProvider` / `useNotifications()`.
 */
export function useRealtimeNotifications(): UseRealtimeNotifications {
  const supabase = useSupabase()
  const { data: currentUser } = useCurrentUser()
  const playerId = currentUser?.id ?? null

  const [rawItems, setRawItems] = useState<NotificationRealtime[]>([])
  const [fetchedFor, setFetchedFor] = useState<string | null>(null)

  useEffect(() => {
    // Pas de joueur : rien a souscrire, et SURTOUT pas de setState synchrone ici.
    if (!playerId) return

    let active = true

    void supabase
      .from('notifications')
      .select(
        'id, player_id, notification_type, title, body, tournament_id, action_url, read_at, created_at',
      )
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data }) => {
        if (!active) return
        setRawItems((data ?? []) as unknown as NotificationRealtime[])
        setFetchedFor(playerId)
      })

    const channel = subscribeToNotifications(supabase, playerId, {
      onInsert: (row) =>
        setRawItems((prev) =>
          prev.some((n) => n.id === row.id) ? prev : [row, ...prev].slice(0, 50),
        ),
      onUpdate: (row) =>
        setRawItems((prev) => prev.map((n) => (n.id === row.id ? row : n))),
    })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [supabase, playerId])

  // Valeurs exposees DERIVEES (aucun setState requis pour le cas « pas de joueur »).
  const items = playerId ? rawItems : []
  const isLoading = playerId !== null && fetchedFor !== playerId

  const unreadCount = useMemo(
    () =>
      playerId
        ? rawItems.reduce((acc, n) => acc + (n.read_at === null ? 1 : 0), 0)
        : 0,
    [rawItems, playerId],
  )

  const markRead = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()
      setRawItems((prev) =>
        prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)),
      )
      await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', id)
        .is('read_at', null)
    },
    [supabase],
  )

  const markAllRead = useCallback(async () => {
    if (!playerId) return
    const now = new Date().toISOString()
    setRawItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('player_id', playerId)
      .is('read_at', null)
  }, [supabase, playerId])

  return { items, unreadCount, isLoading, markRead, markAllRead }
}