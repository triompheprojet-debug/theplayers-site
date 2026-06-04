'use client'

import { createContext, useContext, type ReactNode } from 'react'

import {
  useRealtimeNotifications,
  type UseRealtimeNotifications,
} from '@/hooks/useRealtimeNotifications'

/**
 * RealtimeProvider — souscrit UNE fois aux notifications du joueur et expose
 * l'etat (liste, non-lus, marquage lu) via Context. A monter autour de
 * l'espace joueur (cf. `joueur/layout.tsx`) pour que la cloche du header et
 * les pages partagent la meme souscription.
 *
 * Doit etre sous `SupabaseProvider` + `QueryProvider` (providers globaux).
 */
const NotificationsContext = createContext<UseRealtimeNotifications | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const value = useRealtimeNotifications()
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications(): UseRealtimeNotifications {
  const context = useContext(NotificationsContext)
  if (context === null) {
    throw new Error(
      'useNotifications doit etre utilise a l interieur d un RealtimeProvider.',
    )
  }
  return context
}