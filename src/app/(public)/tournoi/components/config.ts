/**
 * Typage des blocs `config` exposés par la RPC publique get_active_tournament().
 *
 * La RPC renvoie game_info / match_info / rules_info / etc. en `Json` (unknown
 * côté type). Leur forme correspond aux interfaces de config.types.ts. Ce
 * module fournit un accès typé + tolérant aux valeurs manquantes, pour éviter
 * les casts dispersés dans les composants d'onglets.
 *
 * Aucune donnée confidentielle ici : la RPC EXCLUT capacity et payment.*.
 */
import type { PublicActiveTournament } from '@/lib/tournaments/active'
import type {
  EventLocation,
  TournamentDefaultsConsoles,
  TournamentDefaultsGame,
  TournamentDefaultsMatch,
  TournamentDefaultsPrizes,
  TournamentDefaultsRegistration,
  TournamentDefaultsRules,
  TournamentDefaultsSchedule,
} from '@/types/config.types'

export interface PublicTournamentConfig {
  game: TournamentDefaultsGame | null
  match: TournamentDefaultsMatch | null
  rules: TournamentDefaultsRules | null
  registration: TournamentDefaultsRegistration | null
  prizes: TournamentDefaultsPrizes | null
  consoles: TournamentDefaultsConsoles | null
  schedule: TournamentDefaultsSchedule | null
  location: EventLocation | null
}

function asObject<T>(value: unknown): T | null {
  return value && typeof value === 'object' ? (value as T) : null
}

/**
 * Extrait et type les blocs config d'un tournoi public.
 */
export function readPublicConfig(
  t: PublicActiveTournament,
): PublicTournamentConfig {
  return {
    game: asObject<TournamentDefaultsGame>(t.game_info),
    match: asObject<TournamentDefaultsMatch>(t.match_info),
    rules: asObject<TournamentDefaultsRules>(t.rules_info),
    registration: asObject<TournamentDefaultsRegistration>(t.registration_info),
    prizes: asObject<TournamentDefaultsPrizes>(t.prizes),
    consoles: asObject<TournamentDefaultsConsoles>(t.consoles_info),
    schedule: asObject<TournamentDefaultsSchedule>(t.schedule_info),
    location: asObject<EventLocation>(t.location_info),
  }
}