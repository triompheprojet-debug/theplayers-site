import 'server-only'

import { getActiveTournamentId } from '@/lib/config/active-tournament'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type PlayerRank = Database['public']['Enums']['player_rank']

export interface LeaderboardEntry {
  position: number
  pseudo: string
  totalPoints: number
  rank: PlayerRank
}

export interface MyPosition {
  position: number
  totalPoints: number
  rank: PlayerRank
  qualified: boolean
}

/**
 * Saison active = `season_id` du tournoi actif (uniquement si c'est un tournoi
 * de saison ou la Grande Finale). `null` en période hors saison / sans tournoi
 * actif → la page affiche alors un état vide.
 */
export async function getActiveSeasonId(): Promise<string | null> {
  const tournamentId = await getActiveTournamentId()
  if (!tournamentId) return null

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('season_id')
    .eq('id', tournamentId)
    .maybeSingle()

  if (error) {
    console.error('[getActiveSeasonId]', error.message)
    return null
  }
  return data?.season_id ?? null
}

/**
 * Classement public d'une saison via `public_leaderboard_view`
 * (pseudos + points + rang uniquement — jamais de player_id ni de nom réel).
 */
export async function getSeasonLeaderboard(
  seasonId: string,
): Promise<LeaderboardEntry[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('public_leaderboard_view')
    .select('position, pseudo, total_points, current_rank')
    .eq('season_id', seasonId)
    .order('position', { ascending: true })

  if (error) {
    console.error('[getSeasonLeaderboard]', error.message)
    return []
  }

  const entries: LeaderboardEntry[] = []
  for (const row of data ?? []) {
    if (
      row.position === null ||
      row.pseudo === null ||
      row.total_points === null ||
      row.current_rank === null
    ) {
      continue
    }
    entries.push({
      position: row.position,
      pseudo: row.pseudo,
      totalPoints: row.total_points,
      rank: row.current_rank,
    })
  }
  return entries
}

/**
 * Position d'un joueur dans le classement cumulé d'une saison.
 * `null` s'il n'est pas (encore) classé. Lecture service_role (la table
 * `season_standings` est verrouillée par RLS), scoppée à un seul joueur.
 */
export async function getPlayerSeasonPosition(
  playerId: string,
  seasonId: string,
): Promise<MyPosition | null> {
  const supabase = createServiceRoleClient()

  const { data: row, error } = await supabase
    .from('season_standings')
    .select('total_points, current_rank, qualified_grand_final')
    .eq('season_id', seasonId)
    .eq('player_id', playerId)
    .maybeSingle()

  if (error) {
    console.error('[getPlayerSeasonPosition:row]', error.message)
    return null
  }
  if (!row) return null

  const { count, error: countError } = await supabase
    .from('season_standings')
    .select('player_id', { count: 'exact', head: true })
    .eq('season_id', seasonId)
    .gt('total_points', row.total_points)

  if (countError) {
    console.error('[getPlayerSeasonPosition:count]', countError.message)
  }

  return {
    position: (count ?? 0) + 1,
    totalPoints: row.total_points,
    rank: row.current_rank,
    qualified: row.qualified_grand_final,
  }
}