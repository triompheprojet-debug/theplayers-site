import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type MatchStatus = Database['public']['Enums']['match_status']

/**
 * Lecture ADMIN du bracket (M14) — service_role, vue enrichie avec pseudos.
 *
 * Contrairement à `public_bracket_view` (anon, pseudos seulement, publié
 * uniquement), l'admin lit l'état complet quel que soit `bracket_visibility`,
 * pour pouvoir construire/corriger avant publication. On ne renvoie toutefois
 * pas les `*_id` au client : la page admin n'a besoin que des pseudos, badges,
 * scores et chaînage pour le rendu. Les `player_*_id` restent côté serveur
 * (utiles aux actions de score, pas à l'affichage).
 */

export interface AdminBracketMatch {
  id: string
  roundNumber: number
  matchNumber: number
  bracketPosition: string | null
  playerAPseudo: string | null
  playerBPseudo: string | null
  playerABadge: number | null
  playerBBadge: number | null
  /** Conservés pour la saisie de forfait (choix du joueur déclarant forfait). */
  playerAId: string | null
  playerBId: string | null
  scoreA: number | null
  scoreB: number | null
  status: MatchStatus
  winnerSide: 'a' | 'b' | null
  consoleNumber: number | null
  waveNumber: number | null
  scheduledTime: string | null
  nextMatchId: string | null
}

export interface AdminBracketState {
  hasBracket: boolean
  bracketVisibility: string
  rounds: number
  matches: AdminBracketMatch[]
}

/**
 * Charge l'état du bracket d'un tournoi pour l'admin.
 * Retourne `hasBracket=false` si aucun match (bracket pas encore tiré).
 */
export async function getAdminBracket(
  tournamentId: string,
): Promise<AdminBracketState | null> {
  const supabase = createServiceRoleClient()

  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('id, bracket_visibility')
    .eq('id', tournamentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (tError || !tournament) {
    if (tError) console.error('[getAdminBracket:tournament]', tError.message)
    return null
  }

  const { data: rows, error: mError } = await supabase
    .from('matches')
    .select(
      'id, round_number, match_number, bracket_position, player_a_id, player_b_id, player_a_badge, player_b_badge, score_a, score_b, winner_id, status, console_number, wave_number, scheduled_time, next_match_id',
    )
    .eq('tournament_id', tournamentId)
    .order('round_number', { ascending: true })
    .order('match_number', { ascending: true })

  if (mError) {
    console.error('[getAdminBracket:matches]', mError.message)
    return null
  }

  const matchRows = rows ?? []
  if (matchRows.length === 0) {
    return {
      hasBracket: false,
      bracketVisibility: tournament.bracket_visibility,
      rounds: 0,
      matches: [],
    }
  }

  // Pseudos des joueurs présents
  const ids = new Set<string>()
  for (const m of matchRows) {
    if (m.player_a_id) ids.add(m.player_a_id)
    if (m.player_b_id) ids.add(m.player_b_id)
  }
  const pseudos = new Map<string, string>()
  if (ids.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, pseudo')
      .in('id', Array.from(ids))
    for (const p of profiles ?? []) {
      if (p.pseudo) pseudos.set(p.id, p.pseudo)
    }
  }

  let maxRound = 0
  const matches: AdminBracketMatch[] = matchRows.map((m) => {
    if (m.round_number > maxRound) maxRound = m.round_number
    const winnerSide: 'a' | 'b' | null =
      m.winner_id == null
        ? null
        : m.winner_id === m.player_a_id
          ? 'a'
          : 'b'
    return {
      id: m.id,
      roundNumber: m.round_number,
      matchNumber: m.match_number,
      bracketPosition: m.bracket_position,
      playerAPseudo: m.player_a_id ? (pseudos.get(m.player_a_id) ?? null) : null,
      playerBPseudo: m.player_b_id ? (pseudos.get(m.player_b_id) ?? null) : null,
      playerABadge: m.player_a_badge,
      playerBBadge: m.player_b_badge,
      playerAId: m.player_a_id,
      playerBId: m.player_b_id,
      scoreA: m.score_a,
      scoreB: m.score_b,
      status: m.status,
      winnerSide,
      consoleNumber: m.console_number,
      waveNumber: m.wave_number,
      scheduledTime: m.scheduled_time,
      nextMatchId: m.next_match_id,
    }
  })

  return {
    hasBracket: true,
    bracketVisibility: tournament.bracket_visibility,
    rounds: maxRound,
    matches,
  }
}