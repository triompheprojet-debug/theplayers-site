import 'server-only'

import { POINTS_LABELS, type PointsKey } from '@/config/points-table'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { isPointsKey, keyDepthIndex } from './points-calculation'
import { rankFromPoints } from './rank-calculation'

import type { Database } from '@/types/database.types'

type SeasonStandingInsert =
  Database['public']['Tables']['season_standings']['Insert']

export type RecomputeSeasonResult =
  | { ok: true; playersCount: number; qualifiedCount: number }
  | { ok: false; reason: 'season_not_found' | 'db_error' }

export type RecomputeForTournamentResult =
  | { ok: true; recomputed: false }
  | { ok: true; recomputed: true; playersCount: number; qualifiedCount: number }
  | { ok: false; reason: 'season_not_found' | 'db_error' }

interface PlayerAgg {
  total: number
  played: number
  bestKey: PointsKey | null
}

/**
 * Recalcule l'intégralité du classement cumulé d'une saison.
 *
 * - N'agrège QUE les tournois `season` de la saison (DEC-E : la Grande Finale
 *   ne nourrit pas le cumul de qualification — sinon ce serait circulaire).
 * - Cumule `points_earned`, déduit le rang via `getRankFromPoints` (config),
 *   et marque `qualified_grand_final = (cumul >= seasons.qualification_threshold)`
 *   (Règle 5, seuil lu en base, jamais en dur).
 * - Idempotent : remplace les lignes de la saison (delete + insert).
 *
 * Service_role (auth admin custom hors RLS).
 */
export async function recomputeSeasonStandings(
  seasonId: string,
): Promise<RecomputeSeasonResult> {
  const supabase = createServiceRoleClient()

  const { data: season, error: sError } = await supabase
    .from('seasons')
    .select('id, qualification_threshold')
    .eq('id', seasonId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (sError) {
    console.error('[recomputeSeasonStandings:season]', sError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!season) return { ok: false, reason: 'season_not_found' }

  const threshold = season.qualification_threshold

  const { data: tournaments, error: tError } = await supabase
    .from('tournaments')
    .select('id')
    .eq('season_id', seasonId)
    .eq('tournament_type', 'season')
    .eq('is_deleted', false)

  if (tError) {
    console.error('[recomputeSeasonStandings:tournaments]', tError.message)
    return { ok: false, reason: 'db_error' }
  }

  const tournamentIds = (tournaments ?? []).map((t) => t.id)
  const agg = new Map<string, PlayerAgg>()

  if (tournamentIds.length > 0) {
    const { data: standings, error: stError } = await supabase
      .from('tournament_standings')
      .select('player_id, points_earned, round_reached')
      .in('tournament_id', tournamentIds)

    if (stError) {
      console.error('[recomputeSeasonStandings:standings]', stError.message)
      return { ok: false, reason: 'db_error' }
    }

    for (const row of standings ?? []) {
      const current = agg.get(row.player_id) ?? {
        total: 0,
        played: 0,
        bestKey: null,
      }
      current.total += row.points_earned
      current.played += 1
      if (isPointsKey(row.round_reached)) {
        const key = row.round_reached
        if (
          current.bestKey === null ||
          keyDepthIndex(key) < keyDepthIndex(current.bestKey)
        ) {
          current.bestKey = key
        }
      }
      agg.set(row.player_id, current)
    }
  }

  const now = new Date().toISOString()
  let qualifiedCount = 0
  const rows: SeasonStandingInsert[] = []

  for (const [playerId, a] of agg) {
    const qualified = a.total >= threshold
    if (qualified) qualifiedCount += 1
    rows.push({
      season_id: seasonId,
      player_id: playerId,
      total_points: a.total,
      tournaments_played: a.played,
      best_finish: a.bestKey ? POINTS_LABELS[a.bestKey] : null,
      current_rank: rankFromPoints(a.total),
      qualified_grand_final: qualified,
      last_updated_at: now,
    })
  }

  const { error: delError } = await supabase
    .from('season_standings')
    .delete()
    .eq('season_id', seasonId)
  if (delError) {
    console.error('[recomputeSeasonStandings:delete]', delError.message)
    return { ok: false, reason: 'db_error' }
  }

  if (rows.length > 0) {
    const { error: insError } = await supabase
      .from('season_standings')
      .insert(rows)
    if (insError) {
      console.error('[recomputeSeasonStandings:insert]', insError.message)
      return { ok: false, reason: 'db_error' }
    }
  }

  return { ok: true, playersCount: rows.length, qualifiedCount }
}

/**
 * Convenience : recalcule le classement de saison à partir d'un tournoi qui
 * vient d'être finalisé. No-op si le tournoi n'est pas de type `season`
 * (hors saison et Grande Finale n'impactent pas le cumul de qualification).
 */
export async function recomputeSeasonStandingsForTournament(
  tournamentId: string,
): Promise<RecomputeForTournamentResult> {
  const supabase = createServiceRoleClient()

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('season_id, tournament_type')
    .eq('id', tournamentId)
    .maybeSingle()

  if (error) {
    console.error('[recomputeSeasonStandingsForTournament]', error.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!tournament || tournament.tournament_type !== 'season' || !tournament.season_id) {
    return { ok: true, recomputed: false }
  }

  const result = await recomputeSeasonStandings(tournament.season_id)
  if (!result.ok) return result
  return {
    ok: true,
    recomputed: true,
    playersCount: result.playersCount,
    qualifiedCount: result.qualifiedCount,
  }
}