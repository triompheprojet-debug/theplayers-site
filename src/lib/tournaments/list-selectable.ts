/**
 * Liste les tournois sélectionnables pour le sélecteur "Tournoi actif"
 * (utilisé par AdminTopBar / ActiveTournamentSwitcher).
 *
 * - Tous les tournois non-supprimés (HS + Saison + GF)
 * - Triés par start_date desc
 * - Limités aux colonnes nécessaires à l'affichage (PAS de capacity, PAS de config)
 *
 * Lecture via service_role car la table tournaments a RLS bloquante
 * pour anon/authenticated (Règle 1 — capacity confidentielle).
 * Les colonnes retournées ici ne contiennent rien de confidentiel.
 */
import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

export interface SelectableTournament {
  id: string
  name: string
  tournament_type: Database['public']['Enums']['tournament_type']
  start_date: string
  end_date: string
  status: Database['public']['Enums']['tournament_status']
}

/**
 * Retourne tous les tournois non-supprimés, triés du plus récent au plus ancien.
 */
export async function listSelectableTournaments(): Promise<
  SelectableTournament[]
> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, tournament_type, start_date, end_date, status')
    .eq('is_deleted', false)
    .order('start_date', { ascending: false })

  if (error) {
    console.error(
      '[list-selectable] Erreur listSelectableTournaments :',
      error.message,
    )
    return []
  }

  return data ?? []
}
