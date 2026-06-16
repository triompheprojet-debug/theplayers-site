import 'server-only'

import { POINTS_LABELS } from '@/config/points-table'
import { getActiveTournamentId } from '@/lib/config/active-tournament'
import {
  listOffSeasonTournaments,
  listSeasons,
} from '@/lib/seasons/list'
import { getActiveSeasonId } from '@/lib/standings/leaderboard'
import { isPointsKey } from '@/lib/standings/points-calculation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type ServiceClient = ReturnType<typeof createServiceRoleClient>
type TournamentType = Database['public']['Enums']['tournament_type']

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Types exposés ────────────────────────────────────────────────────────────

export interface HistorySeasonTournament {
  name: string
  type: TournamentType
  championPseudo: string | null
}

export interface HistorySeasonEdition {
  kind: 'season'
  slug: string // `saison-{season_number}`
  seasonId: string
  seasonNumber: number
  name: string
  startDate: string
  endDate: string | null
  tournamentsCount: number
  isCurrent: boolean
  championPseudo: string | null
  tournaments: HistorySeasonTournament[]
}

export interface HistoryOffSeasonEdition {
  kind: 'off_season'
  slug: string // id du tournoi
  tournamentId: string
  name: string
  startDate: string
  isCurrent: boolean
  championPseudo: string | null
}

export type HistoryEdition = HistorySeasonEdition | HistoryOffSeasonEdition

export type ResolvedHistorySlug =
  | {
      kind: 'season'
      seasonId: string
      seasonNumber: number
      name: string
      startDate: string
      endDate: string | null
      isCurrent: boolean
    }
  | {
      kind: 'off_season'
      tournamentId: string
      name: string
      startDate: string
      isCurrent: boolean
    }
  | null

export interface TournamentStandingRow {
  position: number
  pseudo: string
  roundLabel: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resolvePseudos(
  supabase: ServiceClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (ids.length === 0) return map
  const { data } = await supabase
    .from('profiles')
    .select('id, pseudo')
    .in('id', ids)
  for (const p of data ?? []) {
    if (p.pseudo) map.set(p.id, p.pseudo)
  }
  return map
}

/** Repli : pseudo du #1 du cumul saison (si pas de Grande Finale). */
async function topSeasonPlayerPseudo(
  supabase: ServiceClient,
  seasonId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('season_standings')
    .select('player_id')
    .eq('season_id', seasonId)
    .order('total_points', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('pseudo')
    .eq('id', data.player_id)
    .maybeSingle()
  return profile?.pseudo ?? null
}

// ── Liste des éditions (archive) ─────────────────────────────────────────────

/**
 * Toutes les éditions (saisons + hors-saison), plus récentes d'abord, enrichies
 * du champion (vainqueur de la Grande Finale pour une saison ; repli sur le #1
 * du cumul) et, pour les saisons, de la liste de leurs tournois.
 */
export async function getHistoryEditions(): Promise<HistoryEdition[]> {
  const supabase = createServiceRoleClient()

  const [seasons, offSeasons, activeSeasonId, activeTournamentId] =
    await Promise.all([
      listSeasons(),
      listOffSeasonTournaments(),
      getActiveSeasonId(),
      getActiveTournamentId(),
    ])

  // Tournois enfants de toutes les saisons (season + grand_final), en une requête
  const seasonIds = seasons.map((s) => s.id)
  const childrenBySeason = new Map<
    string,
    Array<{ name: string; type: TournamentType; winnerId: string | null }>
  >()

  if (seasonIds.length > 0) {
    const { data: children } = await supabase
      .from('tournaments')
      .select('season_id, name, tournament_type, tournament_number, winner_player_id')
      .in('season_id', seasonIds)
      .in('tournament_type', ['season', 'grand_final'])
      .eq('is_deleted', false)
      .order('tournament_number', { ascending: true, nullsFirst: false })

    for (const c of children ?? []) {
      if (!c.season_id) continue
      const list = childrenBySeason.get(c.season_id) ?? []
      list.push({
        name: c.name,
        type: c.tournament_type,
        winnerId: c.winner_player_id,
      })
      childrenBySeason.set(c.season_id, list)
    }
  }

  // Tous les pseudos vainqueurs en une requête
  const winnerIds = new Set<string>()
  for (const t of offSeasons) {
    if (t.winner_player_id) winnerIds.add(t.winner_player_id)
  }
  for (const list of childrenBySeason.values()) {
    for (const c of list) {
      if (c.winnerId) winnerIds.add(c.winnerId)
    }
  }
  const pseudoById = await resolvePseudos(supabase, [...winnerIds])

  const editions: HistoryEdition[] = []

  for (const t of offSeasons) {
    editions.push({
      kind: 'off_season',
      slug: t.id,
      tournamentId: t.id,
      name: t.name,
      startDate: t.start_date,
      isCurrent: t.id === activeTournamentId,
      championPseudo: t.winner_player_id
        ? (pseudoById.get(t.winner_player_id) ?? null)
        : null,
    })
  }

  for (const s of seasons) {
    const children = childrenBySeason.get(s.id) ?? []
    const grandFinal = children.find(
      (c) => c.type === 'grand_final' && c.winnerId,
    )

    let championPseudo: string | null = grandFinal?.winnerId
      ? (pseudoById.get(grandFinal.winnerId) ?? null)
      : null
    if (!championPseudo) {
      championPseudo = await topSeasonPlayerPseudo(supabase, s.id)
    }

    editions.push({
      kind: 'season',
      slug: `saison-${s.season_number}`,
      seasonId: s.id,
      seasonNumber: s.season_number,
      name: s.name,
      startDate: s.start_date,
      endDate: s.end_date,
      tournamentsCount: children.filter((c) => c.type === 'season').length,
      isCurrent: s.id === activeSeasonId,
      championPseudo,
      tournaments: children.map((c) => ({
        name: c.name,
        type: c.type,
        championPseudo: c.winnerId
          ? (pseudoById.get(c.winnerId) ?? null)
          : null,
      })),
    })
  }

  editions.sort((a, b) => b.startDate.localeCompare(a.startDate))
  return editions
}

// ── Résolution d'un slug ─────────────────────────────────────────────────────

/**
 * `saison-{n}` → la saison correspondante ; sinon le slug est l'id (uuid) d'un
 * tournoi hors-saison. `null` si introuvable / slug invalide.
 */
export async function resolveHistorySlug(
  slug: string,
): Promise<ResolvedHistorySlug> {
  const supabase = createServiceRoleClient()
  const seasonMatch = /^saison-(\d+)$/.exec(slug)

  if (seasonMatch) {
    const seasonNumber = Number(seasonMatch[1])
    const { data } = await supabase
      .from('seasons')
      .select('id, name, season_number, start_date, end_date')
      .eq('season_number', seasonNumber)
      .eq('is_deleted', false)
      .maybeSingle()
    if (!data) return null
    const activeSeasonId = await getActiveSeasonId()
    return {
      kind: 'season',
      seasonId: data.id,
      seasonNumber: data.season_number,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      isCurrent: data.id === activeSeasonId,
    }
  }

  if (!UUID_RE.test(slug)) return null

  const { data } = await supabase
    .from('tournaments')
    .select('id, name, start_date')
    .eq('id', slug)
    .eq('tournament_type', 'off_season')
    .eq('is_deleted', false)
    .maybeSingle()
  if (!data) return null

  const activeTournamentId = await getActiveTournamentId()
  return {
    kind: 'off_season',
    tournamentId: data.id,
    name: data.name,
    startDate: data.start_date,
    isCurrent: data.id === activeTournamentId,
  }
}

// ── Classement figé d'un tournoi (détail hors-saison) ────────────────────────

/**
 * Classement final d'un tournoi (positions + pseudo + palier).
 * Utilisé par le détail d'une édition hors-saison.
 */
export async function getTournamentStandings(
  tournamentId: string,
): Promise<TournamentStandingRow[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('tournament_standings')
    .select('position, player_id, round_reached')
    .eq('tournament_id', tournamentId)
    .order('position', { ascending: true })

  if (error) {
    console.error('[getTournamentStandings]', error.message)
    return []
  }

  const rows = data ?? []
  if (rows.length === 0) return []

  const pseudoById = await resolvePseudos(
    supabase,
    rows.map((r) => r.player_id),
  )

  return rows.map((r) => ({
    position: r.position,
    pseudo: pseudoById.get(r.player_id) ?? '',
    roundLabel: isPointsKey(r.round_reached)
      ? POINTS_LABELS[r.round_reached]
      : r.round_reached,
  }))
}