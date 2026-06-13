import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  bracketPositionLabel,
  nextPowerOfTwo,
  seedPlayers,
  totalRounds,
  type BracketSlot,
  type SeededPlayer,
} from '@/lib/bracket/seed-players'
import { getBracketSettings, planRound1Waves } from '@/lib/bracket/waves'

/**
 * Tirage au sort du bracket (M14) — opération DESTRUCTIVE et DÉFINITIVE,
 * protégée par une garde serveur (refus si des matchs existent déjà) et une
 * double confirmation côté UI (Étape 2).
 *
 * Déroulé :
 *   1. Garde : aucun match existant pour ce tournoi.
 *   2. Inscrits `confirmed` avec badge (les seuls éligibles).
 *   3. Réglages depuis `tournaments.config` (Règle 11 — refus si incomplets).
 *   4. Seeding aléatoire + byes (seed-players.ts).
 *   5. Création des matchs de la finale vers le round 1 (chaînage
 *      next_match_id / next_match_slot), byes pré-placés au round 2.
 *   6. Vagues + consoles + horaires sur les matchs créés du round 1.
 *
 * Le bracket reste en `bracket_visibility = 'draft'` : la publication (et les
 * notifications joueurs) est une action séparée (publishBracket, Étape 2).
 *
 * Écritures en service_role : la RLS de `matches` n'autorise AUCUNE écriture
 * client, et la lecture publique seulement si publié.
 */

export interface DrawSummary {
  playerCount: number
  byeCount: number
  matchCount: number
  rounds: number
}

export type DrawBracketResult =
  | { ok: true; summary: DrawSummary }
  | {
      ok: false
      reason:
        | 'tournament_not_found'
        | 'already_drawn'
        | 'not_enough_players'
        | 'missing_config'
        | 'db_error'
    }

interface MatchDraft {
  round_number: number
  match_number: number
  bracket_position: string
  player_a_id: string | null
  player_b_id: string | null
  player_a_badge: number | null
  player_b_badge: number | null
  next_match_id: string | null
  next_match_slot: 'A' | 'B' | null
  console_number: number | null
  wave_number: number | null
  scheduled_time: string | null
}

export async function drawBracket(
  tournamentId: string,
): Promise<DrawBracketResult> {
  const supabase = createServiceRoleClient()

  // 1. Tournoi (config + start_date pour le planning)
  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('id, config, start_date')
    .eq('id', tournamentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (tError) {
    console.error('[drawBracket:tournament]', tError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!tournament) return { ok: false, reason: 'tournament_not_found' }

  // 2. Garde anti-double-tirage (étanchéité tournoi — Règle 12)
  const { count: existing, error: cError } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)

  if (cError) {
    console.error('[drawBracket:guard]', cError.message)
    return { ok: false, reason: 'db_error' }
  }
  if ((existing ?? 0) > 0) return { ok: false, reason: 'already_drawn' }

  // 3. Réglages (Règle 11 : tout depuis la config, refus si incomplet)
  const settings = getBracketSettings(tournament.config)
  if (!settings) return { ok: false, reason: 'missing_config' }

  // 4. Inscrits confirmés avec badge
  const { data: regs, error: rError } = await supabase
    .from('registrations')
    .select('player_id, badge_number')
    .eq('tournament_id', tournamentId)
    .eq('status', 'confirmed')
    .not('badge_number', 'is', null)
    .not('player_id', 'is', null)

  if (rError) {
    console.error('[drawBracket:registrations]', rError.message)
    return { ok: false, reason: 'db_error' }
  }

  const players: SeededPlayer[] = (regs ?? []).map((r) => ({
    playerId: r.player_id as string,
    badge: r.badge_number as number,
  }))
  if (players.length < 2) return { ok: false, reason: 'not_enough_players' }

  // 5. Seeding + géométrie du bracket
  const slots: BracketSlot[] = seedPlayers(players)
  const size = nextPowerOfTwo(players.length)
  const rounds = totalRounds(size)
  const byeCount = size - players.length

  // Brouillons par round (round → MatchDraft[])
  const drafts = new Map<number, MatchDraft[]>()
  for (let r = 1; r <= rounds; r++) {
    const matchesInRound = size / 2 ** r
    drafts.set(
      r,
      Array.from({ length: matchesInRound }, (_, i) => ({
        round_number: r,
        match_number: i + 1,
        bracket_position: bracketPositionLabel(matchesInRound, i + 1),
        player_a_id: null,
        player_b_id: null,
        player_a_badge: null,
        player_b_badge: null,
        next_match_id: null,
        next_match_slot: null,
        console_number: null,
        wave_number: null,
        scheduled_time: null,
      })),
    )
  }

  // Round 1 : paires depuis les slots ; bye → joueur pré-placé au round 2,
  // le match de round 1 correspondant n'est PAS créé.
  // (Accès indexés gardés : tsconfig `noUncheckedIndexedAccess`.)
  const round1 = drafts.get(1) ?? []
  const round2 = drafts.get(2) ?? []
  const round1ToCreate: MatchDraft[] = []

  for (let m = 1; m <= round1.length; m++) {
    const a = slots[2 * m - 2] ?? null
    const b = slots[2 * m - 1] ?? null
    const draft = round1[m - 1]
    if (!draft) continue

    if (a && b) {
      draft.player_a_id = a.playerId
      draft.player_a_badge = a.badge
      draft.player_b_id = b.playerId
      draft.player_b_badge = b.badge
      round1ToCreate.push(draft)
    } else {
      const lone = a ?? b
      const target = round2[Math.ceil(m / 2) - 1]
      if (!lone || !target) continue
      // Pré-placement au round 2 : match cible et slot selon la parité.
      if (m % 2 === 1) {
        target.player_a_id = lone.playerId
        target.player_a_badge = lone.badge
      } else {
        target.player_b_id = lone.playerId
        target.player_b_badge = lone.badge
      }
    }
  }

  // 6. Vagues + consoles + horaires sur les matchs créés du round 1,
  //    ordonnés par match_number (les byes ne consomment pas de créneau).
  const wavePlan = planRound1Waves(
    round1ToCreate.length,
    tournament.start_date,
    settings,
  )
  round1ToCreate.forEach((draft, i) => {
    const slot = wavePlan[i]
    if (!slot) return
    draft.wave_number = slot.waveNumber
    draft.console_number = slot.consoleNumber
    draft.scheduled_time = slot.scheduledTime
  })

  // 7. Insertion de la finale vers le round 1, pour disposer des ids du
  //    round suivant au moment de chaîner next_match_id.
  //    idsByPosition : `${round}:${match_number}` → uuid
  const idsByPosition = new Map<string, string>()

  for (let r = rounds; r >= 1; r--) {
    const roundDrafts = r === 1 ? round1ToCreate : (drafts.get(r) ?? [])
    if (roundDrafts.length === 0) continue

    const rows = roundDrafts.map((d) => ({
      tournament_id: tournamentId,
      round_number: d.round_number,
      match_number: d.match_number,
      bracket_position: d.bracket_position,
      player_a_id: d.player_a_id,
      player_b_id: d.player_b_id,
      player_a_badge: d.player_a_badge,
      player_b_badge: d.player_b_badge,
      next_match_id:
        r < rounds
          ? (idsByPosition.get(`${r + 1}:${Math.ceil(d.match_number / 2)}`) ??
            null)
          : null,
      next_match_slot:
        r < rounds
          ? d.match_number % 2 === 1
            ? ('A' as const)
            : ('B' as const)
          : null,
      console_number: d.console_number,
      wave_number: d.wave_number,
      scheduled_time: d.scheduled_time,
    }))

    const { data: inserted, error: iError } = await supabase
      .from('matches')
      .insert(rows)
      .select('id, match_number')

    if (iError || !inserted) {
      console.error(`[drawBracket:insert:round${r}]`, iError?.message)
      // Nettoyage best-effort : un tirage partiel est inutilisable.
      await supabase.from('matches').delete().eq('tournament_id', tournamentId)
      return { ok: false, reason: 'db_error' }
    }
    for (const row of inserted) {
      idsByPosition.set(`${r}:${row.match_number}`, row.id)
    }
  }

  const matchCount =
    round1ToCreate.length +
    Array.from(drafts.keys())
      .filter((r) => r > 1)
      .reduce((acc, r) => acc + (drafts.get(r)?.length ?? 0), 0)

  return {
    ok: true,
    summary: {
      playerCount: players.length,
      byeCount,
      matchCount,
      rounds,
    },
  }
}