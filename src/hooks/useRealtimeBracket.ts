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
 * - AUCUN `setState` synchrone dans l'effet (règle `react-hooks/set-state-in-effect`) :
 *   la requête est lancée DANS l'effet et `setState` n'est appelé QUE dans le
 *   callback `.then` (mise à jour asynchrone), jamais dans le corps de l'effet
 *   ni via une fonction qui poserait l'état de façon synchrone.
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

  useEffect(() => {
    if (!tournamentId) return

    let active = true

    // Requête de la vue publique. setState UNIQUEMENT dans le `.then`.
    const load = () => {
      void supabase
        .from('public_bracket_view')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })
        .then(({ data }) => {
          if (!active) return
          setMatches((data ?? []) as unknown as BracketMatchRealtime[])
          setFetchedFor(tournamentId)
        })
    }

    load()

    const channel = subscribeToBracket(supabase, tournamentId, {
      onChange: () => load(),
    })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [supabase, tournamentId])

  const refresh = useCallback(async () => {
    if (!tournamentId) return
    const { data } = await supabase
      .from('public_bracket_view')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true })
    setMatches((data ?? []) as unknown as BracketMatchRealtime[])
    setFetchedFor(tournamentId)
  }, [supabase, tournamentId])

  const isLoading = tournamentId != null && fetchedFor !== tournamentId

  return { matches, isLoading, refresh }
}