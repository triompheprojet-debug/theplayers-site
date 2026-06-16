/**
 * Calcul du rang joueur — M16.
 *
 * Fin wrapper autour de `getRankFromPoints` (src/config/ranks.ts) : les seuils
 * (Bronze 0-50 … Légende 601+) NE sont PAS redéfinis ici, ils restent dans la
 * config (source unique). On expose seulement la clé d'enum DB et l'écart au
 * rang suivant (pour la carte « ma position »).
 *
 * Fonctions pures (isomorphes serveur/client).
 */
import { getRankFromPoints } from '@/config/ranks'

import type { Database } from '@/types/database.types'

type PlayerRank = Database['public']['Enums']['player_rank']

/** Rang (enum DB `player_rank`) déduit du cumul de points saison. */
export function rankFromPoints(points: number): PlayerRank {
  return getRankFromPoints(points).key
}

export interface NextRankProgress {
  nextRank: PlayerRank
  /** Points à atteindre pour basculer dans le rang suivant. */
  pointsRemaining: number
}

/**
 * Progression vers le rang suivant. `null` si le joueur est déjà au rang max
 * (Légende, sans plafond). Utilisé par MyPositionCard.
 */
export function pointsToNextRank(points: number): NextRankProgress | null {
  const current = getRankFromPoints(points)
  if (current.maxPoints === null) return null

  const nextThreshold = current.maxPoints + 1
  const next = getRankFromPoints(nextThreshold)

  return {
    nextRank: next.key,
    pointsRemaining: Math.max(0, nextThreshold - Math.max(0, Math.floor(points))),
  }
}