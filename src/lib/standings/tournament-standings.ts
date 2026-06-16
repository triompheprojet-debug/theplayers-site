import 'server-only'

import { POINTS_LABELS, type PointsKey } from '@/config/points-table'
import { getAdminBracket } from '@/lib/bracket/read'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import {
  eliminationKeyForRound,
  isPointsKey,
  keyDepthIndex,
  pointsForResult,
} from './points-calculation'

import type { Database } from '@/types/database.types'

type TournamentType = Database['public']['Enums']['tournament_type']
type StandingInsert =
  Database['public']['Tables']['tournament_standings']['Insert']

/** Stats agrégées + résultat d'un joueur sur le tournoi. */
interface PlayerResult {
  playerId: string
  pseudo: string | null
  roundReached: PointsKey
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  goalsScored: number
  goalsConceded: number
  /** Buts du match d'élimination (sert au départage 3ᵉ/4ᵉ). */
  elimGoalsFor: number
  elimGoalsAgainst: number
  badge: number | null
}

export interface PendingTieBreak {
  playerAId: string
  playerAPseudo: string | null
  playerABadge: number | null
  playerASemiScore: { for: number; against: number }
  playerBId: string
  playerBPseudo: string | null
  playerBBadge: number | null
  playerBSemiScore: { for: number; against: number }
}

export type ComputeStandingsResult =
  | {
      ok: true
      finalized: true
      standingsCount: number
      championPlayerId: string
      runnerUpPlayerId: string
      thirdPlayerId: string | null
    }
  | { ok: true; finalized: false; pendingTieBreak: PendingTieBreak }
  | {
      ok: false
      reason:
        | 'tournament_not_found'
        | 'no_bracket'
        | 'not_finished'
        | 'invalid_bracket'
        | 'db_error'
    }

export interface ComputeStandingsOptions {
  /**
   * Choix manuel du 3ᵉ en cas d'égalité stricte en demi-finale (Voie 2).
   * Doit être l'un des deux perdants de demi ; l'autre devient 4ᵉ.
   */
  thirdPlacePlayerId?: string
}

/**
 * Calcule et fige le classement final d'un tournoi à partir des matches (M14).
 *
 * - Réutilise `getAdminBracket` (service_role) — zéro duplication de lecture.
 * - Champion = vainqueur de la finale ; paliers dérivés du round d'élimination.
 * - 3ᵉ/4ᵉ : départage par différence de buts en demi, puis buts marqués ;
 *   égalité stricte → `pendingTieBreak` (l'admin tranche, re-appel avec
 *   `thirdPlacePlayerId`).
 * - Positions uniques (contrainte SQL) : tri par profondeur de palier puis stats.
 * - Hors saison → 0 point (Règle 4), mais le classement est tout de même figé.
 * - Write-back : `tournaments` (winner/runner_up/third), `registrations`
 *   (final_position/round/points), et recalcul des agrégats `profiles`.
 *
 * Idempotent : ré-exécutable (remplace les lignes existantes du tournoi).
 */
export async function computeTournamentStandings(
  tournamentId: string,
  options: ComputeStandingsOptions = {},
): Promise<ComputeStandingsResult> {
  const supabase = createServiceRoleClient()

  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('id, tournament_type')
    .eq('id', tournamentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (tError) {
    console.error('[computeTournamentStandings:tournament]', tError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!tournament) return { ok: false, reason: 'tournament_not_found' }

  const bracket = await getAdminBracket(tournamentId)
  if (!bracket) return { ok: false, reason: 'db_error' }
  if (!bracket.hasBracket || bracket.matches.length === 0) {
    return { ok: false, reason: 'no_bracket' }
  }

  const totalRounds = bracket.rounds
  const finalMatches = bracket.matches.filter(
    (m) => m.roundNumber === totalRounds,
  )
  if (finalMatches.length !== 1) {
    return { ok: false, reason: 'invalid_bracket' }
  }
  const finalMatch = finalMatches[0]!

  // Tournoi terminé ? Tout match (avec 2 joueurs, non annulé) doit avoir un vainqueur.
  for (const m of bracket.matches) {
    if (
      m.playerAId &&
      m.playerBId &&
      m.status !== 'cancelled' &&
      m.winnerSide === null
    ) {
      return { ok: false, reason: 'not_finished' }
    }
  }

  // ── Agrégation des stats + round d'élimination de chaque perdant ──────────
  const results = new Map<string, PlayerResult>()
  const elimRound = new Map<string, number>()

  const ensure = (
    playerId: string,
    badge: number | null,
    pseudo: string | null,
  ): PlayerResult => {
    let r = results.get(playerId)
    if (!r) {
      r = {
        playerId,
        pseudo,
        roundReached: 'participation',
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        goalsScored: 0,
        goalsConceded: 0,
        elimGoalsFor: 0,
        elimGoalsAgainst: 0,
        badge,
      }
      results.set(playerId, r)
    }
    if (r.badge === null && badge !== null) r.badge = badge
    if (r.pseudo === null && pseudo !== null) r.pseudo = pseudo
    return r
  }

  let championId: string | null = null

  for (const m of bracket.matches) {
    const aId = m.playerAId
    const bId = m.playerBId
    if (!aId || !bId || m.winnerSide === null) continue

    const sa = m.scoreA ?? 0
    const sb = m.scoreB ?? 0

    const a = ensure(aId, m.playerABadge, m.playerAPseudo)
    const b = ensure(bId, m.playerBBadge, m.playerBPseudo)

    a.matchesPlayed += 1
    a.goalsScored += sa
    a.goalsConceded += sb
    b.matchesPlayed += 1
    b.goalsScored += sb
    b.goalsConceded += sa

    const winnerId = m.winnerSide === 'a' ? aId : bId
    const loserId = m.winnerSide === 'a' ? bId : aId

    const winner = results.get(winnerId)
    const loser = results.get(loserId)
    if (winner) winner.matchesWon += 1
    if (loser) {
      loser.matchesLost += 1
      elimRound.set(loserId, m.roundNumber)
      if (loserId === aId) {
        loser.elimGoalsFor = sa
        loser.elimGoalsAgainst = sb
      } else {
        loser.elimGoalsFor = sb
        loser.elimGoalsAgainst = sa
      }
    }

    if (m.roundNumber === totalRounds) championId = winnerId
  }

  if (!championId) return { ok: false, reason: 'not_finished' }

  // ── Palier de chaque joueur ───────────────────────────────────────────────
  for (const r of results.values()) {
    if (r.playerId === championId) {
      r.roundReached = 'champion'
      continue
    }
    const round = elimRound.get(r.playerId)
    if (round === undefined) {
      r.roundReached = 'participation'
      continue
    }
    r.roundReached = eliminationKeyForRound(round, totalRounds)
  }

  // ── Départage 3ᵉ / 4ᵉ (Voie 2) ────────────────────────────────────────────
  let thirdPlayerId: string | null = null
  if (totalRounds >= 2) {
    const semiRound = totalRounds - 1
    const semiLosers: PlayerResult[] = []
    for (const r of results.values()) {
      if (elimRound.get(r.playerId) === semiRound) semiLosers.push(r)
    }

    if (semiLosers.length === 2) {
      const x = semiLosers[0]!
      const y = semiLosers[1]!
      const diffX = x.elimGoalsFor - x.elimGoalsAgainst
      const diffY = y.elimGoalsFor - y.elimGoalsAgainst

      let third: PlayerResult
      let fourth: PlayerResult

      if (diffX !== diffY) {
        third = diffX > diffY ? x : y
        fourth = diffX > diffY ? y : x
      } else if (x.elimGoalsFor !== y.elimGoalsFor) {
        third = x.elimGoalsFor > y.elimGoalsFor ? x : y
        fourth = x.elimGoalsFor > y.elimGoalsFor ? y : x
      } else if (options.thirdPlacePlayerId === x.playerId) {
        third = x
        fourth = y
      } else if (options.thirdPlacePlayerId === y.playerId) {
        third = y
        fourth = x
      } else {
        return {
          ok: true,
          finalized: false,
          pendingTieBreak: {
            playerAId: x.playerId,
            playerAPseudo: x.pseudo,
            playerABadge: x.badge,
            playerASemiScore: {
              for: x.elimGoalsFor,
              against: x.elimGoalsAgainst,
            },
            playerBId: y.playerId,
            playerBPseudo: y.pseudo,
            playerBBadge: y.badge,
            playerBSemiScore: {
              for: y.elimGoalsFor,
              against: y.elimGoalsAgainst,
            },
          },
        }
      }

      third.roundReached = 'third_place'
      fourth.roundReached = 'fourth_place'
      thirdPlayerId = third.playerId
    }
  }

  // ── Tri global → positions uniques (1..N) ─────────────────────────────────
  const ordered = Array.from(results.values()).sort((p, q) => {
    const dp = keyDepthIndex(p.roundReached) - keyDepthIndex(q.roundReached)
    if (dp !== 0) return dp
    const diffP = p.goalsScored - p.goalsConceded
    const diffQ = q.goalsScored - q.goalsConceded
    if (diffP !== diffQ) return diffQ - diffP
    if (p.goalsScored !== q.goalsScored) return q.goalsScored - p.goalsScored
    return (
      (p.badge ?? Number.MAX_SAFE_INTEGER) -
      (q.badge ?? Number.MAX_SAFE_INTEGER)
    )
  })

  const tournamentType: TournamentType = tournament.tournament_type
  const now = new Date().toISOString()

  const rows: StandingInsert[] = ordered.map((r, index) => ({
    tournament_id: tournamentId,
    player_id: r.playerId,
    position: index + 1,
    round_reached: r.roundReached,
    points_earned: pointsForResult(r.roundReached, tournamentType),
    matches_played: r.matchesPlayed,
    matches_won: r.matchesWon,
    matches_lost: r.matchesLost,
    goals_scored: r.goalsScored,
    goals_conceded: r.goalsConceded,
    finalized_at: now,
  }))

  // ── Écriture : remplace les standings du tournoi (idempotent) ─────────────
  const { error: delError } = await supabase
    .from('tournament_standings')
    .delete()
    .eq('tournament_id', tournamentId)
  if (delError) {
    console.error('[computeTournamentStandings:delete]', delError.message)
    return { ok: false, reason: 'db_error' }
  }

  const { error: insError } = await supabase
    .from('tournament_standings')
    .insert(rows)
  if (insError) {
    console.error('[computeTournamentStandings:insert]', insError.message)
    return { ok: false, reason: 'db_error' }
  }

  const runnerUpId =
    finalMatch.winnerSide === 'a' ? finalMatch.playerBId : finalMatch.playerAId

  // ── Write-back tournaments (winner / runner_up / third) ───────────────────
  const { error: tUpdError } = await supabase
    .from('tournaments')
    .update({
      winner_player_id: championId,
      runner_up_player_id: runnerUpId,
      third_player_id: thirdPlayerId,
    })
    .eq('id', tournamentId)
  if (tUpdError) {
    console.error('[computeTournamentStandings:tournaments]', tUpdError.message)
    return { ok: false, reason: 'db_error' }
  }

  // ── Write-back registrations (final_position / final_round / points) ──────
  for (let i = 0; i < ordered.length; i++) {
    const r = ordered[i]!
    const { error: rUpdError } = await supabase
      .from('registrations')
      .update({
        final_position: i + 1,
        final_round: POINTS_LABELS[r.roundReached],
        points_earned: pointsForResult(r.roundReached, tournamentType),
      })
      .eq('tournament_id', tournamentId)
      .eq('player_id', r.playerId)
    if (rUpdError) {
      console.error(
        '[computeTournamentStandings:registrations]',
        rUpdError.message,
      )
    }
  }

  // ── Recalcul des agrégats profiles (DEC-B, idempotent) ────────────────────
  await recomputeProfileAggregates(
    ordered.map((r) => r.playerId),
    supabase,
  )

  return {
    ok: true,
    finalized: true,
    standingsCount: rows.length,
    championPlayerId: championId,
    runnerUpPlayerId: runnerUpId ?? '',
    thirdPlayerId,
  }
}

/**
 * Recalcule `profiles.total_points / tournaments_played / best_finish` à partir
 * de TOUS les `tournament_standings` du joueur (toutes éditions confondues).
 * Recalcul (et non incrément) → idempotent en cas de ré-exécution.
 */
async function recomputeProfileAggregates(
  playerIds: string[],
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<void> {
  if (playerIds.length === 0) return

  const { data, error } = await supabase
    .from('tournament_standings')
    .select('player_id, points_earned, round_reached')
    .in('player_id', playerIds)

  if (error) {
    console.error('[recomputeProfileAggregates:select]', error.message)
    return
  }

  const agg = new Map<
    string,
    { total: number; played: number; bestKey: PointsKey | null }
  >()
  for (const row of data ?? []) {
    if (!isPointsKey(row.round_reached)) continue
    const key = row.round_reached
    const current = agg.get(row.player_id) ?? {
      total: 0,
      played: 0,
      bestKey: null,
    }
    current.total += row.points_earned
    current.played += 1
    if (
      current.bestKey === null ||
      keyDepthIndex(key) < keyDepthIndex(current.bestKey)
    ) {
      current.bestKey = key
    }
    agg.set(row.player_id, current)
  }

  for (const [playerId, a] of agg) {
    const { error: upError } = await supabase
      .from('profiles')
      .update({
        total_points: a.total,
        tournaments_played: a.played,
        best_finish: a.bestKey ? POINTS_LABELS[a.bestKey] : null,
      })
      .eq('id', playerId)
    if (upError) {
      console.error('[recomputeProfileAggregates:update]', upError.message)
    }
  }
}