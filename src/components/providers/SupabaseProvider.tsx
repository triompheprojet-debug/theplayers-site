'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * SupabaseProvider — expose un client Supabase navigateur typé via Context.
 *
 * Usage : tout Client Component qui a besoin de Supabase (subscriptions Realtime,
 * mutations côté client, etc.) peut appeler useSupabase() au lieu de re-créer
 * un client à chaque mount.
 *
 * NB : le client est créé une fois via useState() et reste stable pour la durée
 * du mount. Pas besoin de useMemo.
 *
 * Pour les Server Components / Server Actions / Route Handlers, NE PAS utiliser
 * ce provider : utiliser directement createClient() de @/lib/supabase/server.
 */

type TypedSupabaseClient = SupabaseClient<Database>

const SupabaseContext = createContext<TypedSupabaseClient | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState<TypedSupabaseClient>(() => createClient())

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
}

/**
 * Hook pour consommer le client Supabase dans un Client Component.
 * Throw si appelé en dehors d'un SupabaseProvider (faille de configuration).
 */
export function useSupabase(): TypedSupabaseClient {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error(
      'useSupabase doit être utilisé à l\'intérieur d\'un SupabaseProvider. ' +
        'Vérifie que ton composant est bien sous <SupabaseProvider> dans l\'arbre.',
    )
  }
  return context
}