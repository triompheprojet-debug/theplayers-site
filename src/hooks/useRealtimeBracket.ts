'use client'

import { useCallback, useEffect, useState } from 'react'

import { useSupabase } from '@/components/providers/SupabaseProvider'
import {
  subscribeToBracket,
  type BracketMatchRealtime,
} from '@/lib/realtime/bracket-channel'

export interface UseRealtimeBracket {
  matches: BracketMatchRealtime[]
  isLoading: boolean
  /** Refetch manuel (rarement nécessaire : le Realtime déclenche déjà). */
  refresh: () => Promise<void>
}

/**
 * Bracket public d'un tournoi, en temps réel.
 *
 * - Lit `public_bracket_view` (pseudos + badges seulement ; la vue applique le
 *   filtre `bracket_visibility = published` → 0 ligne tant que non publié).
 * - Souscrit aux changements de `matches` (filtre tournoi) ; à chaque
 *   événement, refetch la vue (la donnée sensible ne transite jamais par le
 *   canal Realtime).
 * - AUCUN `setState` synchrone dans l'effet : l'état est posé dans des
 *   callbacks async (règle `react-hooks/set-state-in-effect`).
 *
 * `tournamentId` null/undefined → hook inerte (utile avant résolution du
 * tournoi actif côté Server Component parent).
 */
export function useRealtimeBracket(
  tournamentId: string | null | undefined,
): UseRealtimeBracket {
  const supabase = useSupabase()

  const [matches, setMatches] = useState<BracketMatchRealtime[]>([])
  const [fetchedFor, setFetchedFor] = useState<string | null>(null)

  const fetchMatches = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from('public_bracket_view')
        .select('*')
        .eq('tournament_id', id)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })

      setMatches((data ?? []) as unknown as BracketMatchRealtime[])
      setFetchedFor(id)
    },
    [supabase],
  )

  useEffect(() => {
    if (!tournamentId) return

    let active = true
    void fetchMatches(tournamentId).then(() => {
      if (!active) return
    })

    const channel = subscribeToBracket(supabase, tournamentId, {
      onChange: () => {
        void fetchMatches(tournamentId)
      },
    })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [supabase, tournamentId, fetchMatches])

  const refresh = useCallback(async () => {
    if (tournamentId) await fetchMatches(tournamentId)
  }, [tournamentId, fetchMatches])

  const isLoading = tournamentId != null && fetchedFor !== tournamentId

  return { matches, isLoading, refresh }
}