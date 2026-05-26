'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

/**
 * QueryProvider — gestion du cache TanStack Query côté navigateur ET serveur.
 *
 * Pattern officiel React Query v5 pour Next.js App Router :
 *  - Côté serveur : nouvelle instance par requête (sinon les données fuient entre utilisateurs)
 *  - Côté navigateur : singleton réutilisé entre re-renders pour préserver le cache
 *
 * Voir : https://tanstack.com/query/v5/docs/framework/react/guides/ssr
 */

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 60s = bon défaut pour des données semi-statiques (config, classements)
        // Les pages temps réel (bracket en direct) override via leur propre staleTime
        staleTime: 60 * 1000,
        // Garde le cache 5 min après dernière utilisation
        gcTime: 5 * 60 * 1000,
        // Pas de refetch automatique au focus de la fenêtre (évite les surprises sur 2G/3G)
        refetchOnWindowFocus: false,
        // 1 retry sur erreur réseau (utile en zone à connexion instable)
        retry: 1,
      },
      mutations: {
        // Pas de retry sur les mutations (peut créer des doublons d'inscriptions/paiements)
        retry: false,
      },
    },
  })
}

// Singleton côté navigateur uniquement
let browserQueryClient: QueryClient | undefined

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Serveur : nouvelle instance à chaque appel (isolation par requête)
    return makeQueryClient()
  }
  // Navigateur : singleton
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState avec initializer pour ne créer le client qu'une seule fois
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}