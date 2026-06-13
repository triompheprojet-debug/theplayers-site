import type {
  RealtimeChannel,
  SupabaseClient,
} from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

type TypedClient = SupabaseClient<Database>

/**
 * Forme d'une ligne de bracket côté client, alignée sur `public_bracket_view`
 * (pseudos + badges uniquement, AUCUN identifiant joueur — Règles 1 & 2).
 *
 * NB : le Realtime postgres_changes émet les colonnes de la TABLE `matches`,
 * pas de la vue. On souscrit donc à `matches` (filtré par tournoi) mais on ne
 * RELIT jamais les identifiants : le hook refetch la VUE publique après chaque
 * événement (la vue applique le filtre `bracket_visibility = published` et ne
 * fuit pas les ids). Ce type décrit la donnée telle que LUE depuis la vue.
 */
export interface BracketMatchRealtime {
  id: string
  tournament_id: string
  round_number: number
  match_number: number
  bracket_position: string | null
  player_a_pseudo: string | null
  player_b_pseudo: string | null
  player_a_badge: number | null
  player_b_badge: number | null
  score_a: number | null
  score_b: number | null
  status: string
  wave_number: number | null
  console_number: number | null
  scheduled_time: string | null
  winner_side: 'a' | 'b' | null
  next_match_id: string | null
  next_match_slot: string | null
}

interface SubscribeHandlers {
  /** Appelé à chaque changement (INSERT/UPDATE/DELETE) sur les matchs du tournoi. */
  onChange?: () => void
}

/**
 * Souscrit aux changements des matchs d'un tournoi (filtre serveur par
 * `tournament_id`). Comme la lecture détaillée passe par la vue publique
 * (sécurisée), le handler ne reçoit pas la ligne brute : il déclenche un
 * refetch côté hook. Renvoie le canal (à retirer via
 * `supabase.removeChannel(channel)` au cleanup). Pur navigateur.
 */
export function subscribeToBracket(
  supabase: TypedClient,
  tournamentId: string,
  handlers: SubscribeHandlers,
): RealtimeChannel {
  return supabase
    .channel(`bracket:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => handlers.onChange?.(),
    )
    .subscribe()
}