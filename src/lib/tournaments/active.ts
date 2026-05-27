/**
 * Récupération du tournoi actif.
 *
 * Deux variantes :
 *  - getActiveTournamentForAdmin() : table directe via service_role,
 *    inclut `capacity` (Règle 1 — visible admin uniquement) et `config`
 *    entier (incluant payment.*).
 *  - getActiveTournamentPublic() : appel RPC get_active_tournament(),
 *    EXCLUT capacity et payment.*. Pour pages publiques (M05+).
 *
 * Les deux renvoient null si aucun tournoi n'est défini ou si l'UUID
 * stocké pointe vers un tournoi soft-deleted.
 */
import 'server-only'

import { cache } from 'react'

import { getActiveTournamentId } from '@/lib/config/active-tournament'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

export type AdminActiveTournament =
  Database['public']['Tables']['tournaments']['Row']

export type PublicActiveTournament = {
  id: string
  name: string
  tournament_type: Database['public']['Enums']['tournament_type']
  season_id: string | null
  tournament_number: number | null
  start_date: string
  end_date: string
  registration_opens_at: string | null
  registration_closes_at: string | null
  status: Database['public']['Enums']['tournament_status']
  is_registrations_open: boolean
  bracket_visibility: string
  game_info: unknown
  prizes: unknown
  registration_info: unknown
  schedule_info: unknown
  location_info: unknown
  consoles_info: unknown
  match_info: unknown
  rules_info: unknown
}

/**
 * Version admin : capacity + config complet visibles.
 * Lecture via service_role (RLS bloquante sur tournaments).
 *
 * `cache()` = request-scoped : appelé plusieurs fois dans le même rendu
 * (sidebar + topbar + page), une seule requête DB.
 */
export const getActiveTournamentForAdmin = cache(
  async (): Promise<AdminActiveTournament | null> => {
    const activeId = await getActiveTournamentId()
    if (!activeId) return null

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', activeId)
      .eq('is_deleted', false)
      .maybeSingle()

    if (error) {
      console.error(
        '[active-tournament/admin] Erreur lecture :',
        error.message,
      )
      return null
    }
    return data
  },
)

/**
 * Version publique : passe par la RPC get_active_tournament()
 * qui exclut capacity et payment.*.
 *
 * Lecture via client SSR standard (anon key). La fonction SQL est
 * SECURITY DEFINER + GRANT EXECUTE TO anon → accessible.
 */
export const getActiveTournamentPublic = cache(
  async (): Promise<PublicActiveTournament | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_active_tournament')

    if (error) {
      console.error(
        '[active-tournament/public] Erreur RPC :',
        error.message,
      )
      return null
    }
    if (!data || data.length === 0) return null

    // La RPC retourne TABLE(...) → tableau de lignes ; max 1 ligne
    return data[0] as PublicActiveTournament
  },
)
