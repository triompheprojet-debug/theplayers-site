import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type MatchUpdate = Database['public']['Tables']['matches']['Update']

/**
 * Saisie de score (M14) — CŒUR PARTAGÉ : utilisé par l'admin (Étape 2) et
 * réutilisé tel quel par l'espace arbitre (M15).
 *
 * - Score normal : pas d'égalité possible (élimination directe) → winner_id
 *   déduit, status = 'completed', played_at + scored_by posés.
 * - Forfait : forfeit_player_id ∈ {A, B}, le vainqueur est l'autre joueur,
 *   status = 'forfeit' (scores facultatifs).
 * - L'avancement du vainqueur au tour suivant est fait par le TRIGGER SQL
 *   trg_matches_advance_winner — jamais ici (zéro duplication).
 * - Correction admin : re-saisir un match déjà 'completed'/'forfeit' est
 *   autorisé ; le trigger écrase le slot du match suivant avec le nouveau
 *   vainqueur. Si le match SUIVANT est déjà joué, la correction en cascade
 *   reste une opération manuelle admin (cas signalé via `nextAlreadyPlayed`
 *   en avertissement, non bloquant).
 *
 * Écritures en service_role (admin/arbitre = auth custom, hors RLS).
 */

export interface SubmitScoreArgs {
  matchId: string
  /** Compte admin OU arbitre (admin_accounts.id) qui saisit. */
  scoredBy: string
  scoreA?: number
  scoreB?: number
  /** Si renseigné : forfait de ce joueur (doit être player_a ou player_b). */
  forfeitPlayerId?: string
  forfeitReason?: string
}

export type SubmitScoreResult =
  | {
      ok: true
      winnerId: string
      status: 'completed' | 'forfeit'
      /** Avertissement : le match suivant était déjà joué (correction en cascade manuelle). */
      nextAlreadyPlayed: boolean
    }
  | {
      ok: false
      reason:
        | 'match_not_found'
        | 'players_missing'
        | 'match_cancelled'
        | 'invalid_scores'
        | 'draw_not_allowed'
        | 'invalid_forfeit_player'
        | 'db_error'
    }

function isValidScore(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export async function submitMatchScore(
  args: SubmitScoreArgs,
): Promise<SubmitScoreResult> {
  const supabase = createServiceRoleClient()

  const { data: match, error: mError } = await supabase
    .from('matches')
    .select('id, status, player_a_id, player_b_id, next_match_id')
    .eq('id', args.matchId)
    .maybeSingle()

  if (mError) {
    console.error('[submitMatchScore:fetch]', mError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!match) return { ok: false, reason: 'match_not_found' }
  if (match.status === 'cancelled') {
    return { ok: false, reason: 'match_cancelled' }
  }
  if (!match.player_a_id || !match.player_b_id) {
    return { ok: false, reason: 'players_missing' }
  }

  const now = new Date().toISOString()
  let winnerId: string
  let update: MatchUpdate
  let status: 'completed' | 'forfeit'

  if (args.forfeitPlayerId) {
    // ── Forfait ────────────────────────────────────────────────────────
    if (
      args.forfeitPlayerId !== match.player_a_id &&
      args.forfeitPlayerId !== match.player_b_id
    ) {
      return { ok: false, reason: 'invalid_forfeit_player' }
    }
    winnerId =
      args.forfeitPlayerId === match.player_a_id
        ? match.player_b_id
        : match.player_a_id
    status = 'forfeit'
    update = {
      status,
      winner_id: winnerId,
      forfeit_player_id: args.forfeitPlayerId,
      forfeit_reason: args.forfeitReason ?? null,
      score_a: isValidScore(args.scoreA) ? args.scoreA : null,
      score_b: isValidScore(args.scoreB) ? args.scoreB : null,
      played_at: now,
      scored_by: args.scoredBy,
    }
  } else {
    // ── Score normal ───────────────────────────────────────────────────
    if (!isValidScore(args.scoreA) || !isValidScore(args.scoreB)) {
      return { ok: false, reason: 'invalid_scores' }
    }
    if (args.scoreA === args.scoreB) {
      return { ok: false, reason: 'draw_not_allowed' }
    }
    winnerId = args.scoreA > args.scoreB ? match.player_a_id : match.player_b_id
    status = 'completed'
    update = {
      status,
      winner_id: winnerId,
      score_a: args.scoreA,
      score_b: args.scoreB,
      forfeit_player_id: null,
      forfeit_reason: null,
      played_at: now,
      scored_by: args.scoredBy,
    }
  }

  // Avertissement correction en cascade : le match suivant est-il déjà joué ?
  let nextAlreadyPlayed = false
  if (match.next_match_id) {
    const { data: next } = await supabase
      .from('matches')
      .select('status')
      .eq('id', match.next_match_id)
      .maybeSingle()
    nextAlreadyPlayed =
      next?.status === 'completed' || next?.status === 'forfeit'
  }

  const { error: uError } = await supabase
    .from('matches')
    .update(update)
    .eq('id', args.matchId)

  if (uError) {
    console.error('[submitMatchScore:update]', uError.message)
    return { ok: false, reason: 'db_error' }
  }

  return { ok: true, winnerId, status, nextAlreadyPlayed }
}