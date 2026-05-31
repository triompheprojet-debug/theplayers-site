/**
 * Liste des tournois rattachés à une saison (M03.G).
 *
 * Renvoie les tournois de type 'season' ET 'grand_final' liés à la saison,
 * non-supprimés, triés par tournament_number (la Grande Finale, sans numéro,
 * apparaît en dernier).
 *
 * service_role : la table tournaments a RLS bloquante (Règle 1 — capacity).
 * Les colonnes retournées ici ne contiennent rien de confidentiel.
 */
import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Database } from '@/types/database.types'

export interface SeasonTournament {
  id: string
  name: string
  tournament_type: Database['public']['Enums']['tournament_type']
  tournament_number: number | null
  start_date: string
  end_date: string
  status: Database['public']['Enums']['tournament_status']
}

export async function listTournamentsBySeason(
  seasonId: string,
): Promise<SeasonTournament[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('tournaments')
    .select(
      'id, name, tournament_type, tournament_number, start_date, end_date, status',
    )
    .eq('season_id', seasonId)
    .eq('is_deleted', false)
    .order('tournament_number', { ascending: true, nullsFirst: false })

  if (error) {
    console.error(
      '[tournaments/list-by-season] Erreur listTournamentsBySeason :',
      error.message,
    )
    return []
  }

  return data ?? []
}

/**
 * Indique si une Grande Finale existe déjà pour cette saison.
 * Utile pour conditionner l'affichage du bouton "Créer la Grande Finale".
 */
export function hasGrandFinal(tournaments: SeasonTournament[]): boolean {
  return tournaments.some((t) => t.tournament_type === 'grand_final')
}

/**
 * Retourne le prochain numéro de tournoi disponible dans la saison
 * (max des numéros existants + 1, en ignorant la Grande Finale).
 */
export function nextTournamentNumber(tournaments: SeasonTournament[]): number {
  const numbers = tournaments
    .filter((t) => t.tournament_type === 'season' && t.tournament_number !== null)
    .map((t) => t.tournament_number as number)
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1
}