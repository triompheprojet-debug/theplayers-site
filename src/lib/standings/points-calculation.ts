/**
 * Calcul des points par palier — M16.
 *
 * Source du barème : src/config/points-table.ts (POINTS_TABLE).
 * Règle 4 : un tournoi hors saison ne distribue aucun point de ligue.
 *
 * Fonctions pures (isomorphes serveur/client) : aucune I/O, aucun import runtime
 * autre que la config. La dérivation des paliers depuis les matches se fait dans
 * tournament-standings.ts, qui consomme `eliminationKeyForRound`.
 */
import {
  POINTS_TABLE,
  POINTS_KEYS_ORDERED,
  type PointsKey,
} from '@/config/points-table'

import type { Database } from '@/types/database.types'

type TournamentType = Database['public']['Enums']['tournament_type']

/** Garde de type : la valeur texte est-elle une clé de barème valide ? */
export function isPointsKey(value: string): value is PointsKey {
  return (POINTS_KEYS_ORDERED as readonly string[]).includes(value)
}

/** Points bruts d'un palier, sans tenir compte du type de tournoi. */
export function rawPointsForKey(key: PointsKey): number {
  return POINTS_TABLE[key]
}

/**
 * Points effectivement attribués selon le palier ET le type de tournoi.
 * Hors saison (`off_season`) → 0 (Règle 4).
 */
export function pointsForResult(
  key: PointsKey,
  tournamentType: TournamentType,
): number {
  if (tournamentType === 'off_season') return 0
  return POINTS_TABLE[key]
}

/**
 * Palier (PointsKey) d'un joueur ÉLIMINÉ, selon sa distance à la finale.
 *
 *   fromEnd = totalRounds - roundNumber
 *   (round max = finale → fromEnd 0 ; demi → 1 ; quart → 2 ; ...)
 *
 * Le champion (vainqueur de la finale) est traité à part par l'appelant.
 * À `fromEnd 1` (demi-finale) renvoie le palier par DÉFAUT `third_place` ;
 * l'appelant départage 3ᵉ/4ᵉ et réaffecte le perdant à `fourth_place`
 * (pas de petite finale — Voie 2).
 */
export function eliminationKeyFromDistance(fromEnd: number): PointsKey {
  switch (fromEnd) {
    case 0:
      return 'runner_up'
    case 1:
      return 'third_place'
    case 2:
      return 'quarter_final'
    case 3:
      return 'round_of_16'
    case 4:
      return 'round_of_32'
    case 5:
      return 'round_of_64'
    default:
      return 'participation'
  }
}

/**
 * Palier d'un perdant selon le round où il a été éliminé.
 *
 * - Finale (roundNumber === totalRounds) → `runner_up`.
 * - DEC-A : le tout premier tour vaut TOUJOURS `participation`, dès lors qu'il
 *   est antérieur à la demi-finale (bracket d'au moins 3 tours / 8 joueurs).
 *   Pour un bracket de 4 joueurs (2 tours), le 1er tour est la demi → 3ᵉ/4ᵉ.
 * - Sinon : mapping par distance à la finale.
 */
export function eliminationKeyForRound(
  roundNumber: number,
  totalRounds: number,
): PointsKey {
  if (roundNumber >= totalRounds) return 'runner_up'
  if (roundNumber === 1 && totalRounds >= 3) return 'participation'
  return eliminationKeyFromDistance(totalRounds - roundNumber)
}

/**
 * Indice de profondeur d'un palier dans POINTS_KEYS_ORDERED
 * (0 = champion, valeur croissante = éliminé plus tôt).
 * Sert au tri/tie-break des classements.
 */
export function keyDepthIndex(key: PointsKey): number {
  const index = POINTS_KEYS_ORDERED.indexOf(key)
  return index < 0 ? POINTS_KEYS_ORDERED.length : index
}