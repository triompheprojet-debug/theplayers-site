/**
 * Listes pour la section "Éditions" de l'admin (M03.D).
 *
 *  - listSeasons() : toutes les saisons non-supprimées
 *  - listOffSeasonTournaments() : tous les tournois HS non-supprimés
 *  - listEditions() : mix trié par start_date desc (vue principale)
 *
 * Tout passe par service_role :
 *  - seasons : SELECT public ouvert mais on lit déjà côté admin → service_role
 *    pour homogénéité et pour récupérer is_deleted, audit fields.
 *  - tournaments : SELECT public bloqué (Règle 1 capacity) → service_role obligatoire.
 */
import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Database } from '@/types/database.types'

export type Season = Database['public']['Tables']['seasons']['Row']
export type Tournament = Database['public']['Tables']['tournaments']['Row']

/**
 * Tournoi Hors Saison (alias documentaire — même type Row,
 * juste un filtre sur tournament_type).
 */
export type OffSeasonTournament = Tournament

/**
 * Élément d'édition côté UI : un type discriminé qui distingue
 * une saison d'un tournoi Hors Saison.
 */
export type Edition =
  | { kind: 'off_season'; tournament: OffSeasonTournament }
  | { kind: 'season'; season: Season; tournamentsCount: number }

/**
 * Toutes les saisons non-supprimées, triées par numéro descendant.
 */
export async function listSeasons(): Promise<Season[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_deleted', false)
    .order('season_number', { ascending: false })

  if (error) {
    console.error('[seasons/list] Erreur listSeasons :', error.message)
    return []
  }
  return data ?? []
}

/**
 * Tous les tournois Hors Saison non-supprimés, triés par start_date desc.
 */
export async function listOffSeasonTournaments(): Promise<OffSeasonTournament[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('tournament_type', 'off_season')
    .eq('is_deleted', false)
    .order('start_date', { ascending: false })

  if (error) {
    console.error(
      '[seasons/list] Erreur listOffSeasonTournaments :',
      error.message,
    )
    return []
  }
  return data ?? []
}

/**
 * Toutes les éditions (HS + Saisons) triées par date desc.
 * Pour chaque saison, compte ses tournois enfants (type='season').
 *
 * Note : pour M03 on lit les compteurs en mémoire (peu de saisons,
 * petite volumétrie). Si besoin, basculer vers une vue SQL plus tard.
 */
export async function listEditions(): Promise<Edition[]> {
  const [seasons, offSeasons, seasonChildrenCounts] = await Promise.all([
    listSeasons(),
    listOffSeasonTournaments(),
    countTournamentsBySeason(),
  ])

  const editions: Edition[] = []

  for (const tournament of offSeasons) {
    editions.push({ kind: 'off_season', tournament })
  }
  for (const season of seasons) {
    editions.push({
      kind: 'season',
      season,
      tournamentsCount: seasonChildrenCounts.get(season.id) ?? 0,
    })
  }

  // Tri global par start_date desc (champ commun)
  editions.sort((a, b) => {
    const dateA = a.kind === 'off_season' ? a.tournament.start_date : a.season.start_date
    const dateB = b.kind === 'off_season' ? b.tournament.start_date : b.season.start_date
    return dateB.localeCompare(dateA)
  })

  return editions
}

/**
 * Compte par saison le nombre de tournois enfants (type='season',
 * NON Grande Finale, non-supprimés).
 */
async function countTournamentsBySeason(): Promise<Map<string, number>> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('season_id')
    .eq('tournament_type', 'season')
    .eq('is_deleted', false)
    .not('season_id', 'is', null)

  const map = new Map<string, number>()
  if (error || !data) {
    if (error) {
      console.error(
        '[seasons/list] Erreur countTournamentsBySeason :',
        error.message,
      )
    }
    return map
  }

  for (const row of data) {
    if (row.season_id) {
      map.set(row.season_id, (map.get(row.season_id) ?? 0) + 1)
    }
  }
  return map
}