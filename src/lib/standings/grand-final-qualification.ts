import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type PlayerRank = Database['public']['Enums']['player_rank']

/** Un joueur est qualifié si son cumul saison atteint le seuil (Règle 5). */
export function isQualified(totalPoints: number, threshold: number): boolean {
  return totalPoints >= threshold
}

export interface QualifiedPlayer {
  playerId: string
  pseudo: string
  totalPoints: number
  rank: PlayerRank
  position: number
}

/**
 * Liste ordonnée (points décroissants) des joueurs qualifiés pour la Grande
 * Finale d'une saison, d'après le drapeau `qualified_grand_final` posé par
 * `recomputeSeasonStandings`. Pseudos uniquement (Règle 2), jamais de nom réel.
 */
export async function getQualifiedPlayers(
  seasonId: string,
): Promise<QualifiedPlayer[]> {
  const supabase = createServiceRoleClient()

  const { data: rows, error } = await supabase
    .from('season_standings')
    .select('player_id, total_points, current_rank')
    .eq('season_id', seasonId)
    .eq('qualified_grand_final', true)
    .order('total_points', { ascending: false })

  if (error) {
    console.error('[getQualifiedPlayers:standings]', error.message)
    return []
  }

  const standings = rows ?? []
  if (standings.length === 0) return []

  const ids = standings.map((r) => r.player_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, pseudo')
    .in('id', ids)

  const pseudoById = new Map<string, string>()
  for (const p of profiles ?? []) {
    if (p.pseudo) pseudoById.set(p.id, p.pseudo)
  }

  return standings.map((r, index) => ({
    playerId: r.player_id,
    pseudo: pseudoById.get(r.player_id) ?? '',
    totalPoints: r.total_points,
    rank: r.current_rank,
    position: index + 1,
  }))
}