/**
 * Seuils de rangs par cumul de points (saison) — règle structurelle.
 * Source : 01_projet.md §4.4
 *
 * À utiliser conjointement avec l'enum DB player_rank
 * (importé via Enums<'player_rank'> dans app.types.ts).
 */

export type PlayerRankKey = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend'

export interface RankTier {
  key: PlayerRankKey
  label: string
  minPoints: number       // inclus
  maxPoints: number | null // null = pas de plafond (Légende)
  color: string            // CSS variable du design system
}

export const RANK_TIERS: readonly RankTier[] = [
  {
    key: 'bronze',
    label: 'Bronze',
    minPoints: 0,
    maxPoints: 50,
    color: '#cd7f32',
  },
  {
    key: 'silver',
    label: 'Argent',
    minPoints: 51,
    maxPoints: 150,
    color: '#c0c0c0',
  },
  {
    key: 'gold',
    label: 'Or',
    minPoints: 151,
    maxPoints: 350,
    color: '#ffd700',
  },
  {
    key: 'diamond',
    label: 'Diamant',
    minPoints: 351,
    maxPoints: 600,
    color: '#60a5fa',
  },
  {
    key: 'legend',
    label: 'Légende',
    minPoints: 601,
    maxPoints: null,
    color: '#a855f7',
  },
] as const

/**
 * Retourne le RankTier correspondant aux points cumulés donnés.
 * Toujours défini (Bronze couvre 0+).
 */
export function getRankFromPoints(points: number): RankTier {
  const safePoints = Math.max(0, Math.floor(points));

  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    const tier = RANK_TIERS[i];
    
    if (tier && safePoints >= tier.minPoints) {
      return tier;
    }
  }
  
  return RANK_TIERS[0]!;
}
