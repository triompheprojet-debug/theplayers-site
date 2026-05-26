import { cn } from '@/lib/utils'
import { RANK_TIERS, type PlayerRankKey } from '@/config/ranks'
import { BronzeIcon } from '@/components/icons/RankIcons/BronzeIcon'
import { SilverIcon } from '@/components/icons/RankIcons/SilverIcon'
import { GoldIcon } from '@/components/icons/RankIcons/GoldIcon'
import { DiamondIcon } from '@/components/icons/RankIcons/DiamondIcon'
import { LegendIcon } from '@/components/icons/RankIcons/LegendIcon'

type RankBadgeSize = 'sm' | 'md' | 'lg'

interface RankBadgeProps {
  rank: PlayerRankKey
  withLabel?: boolean
  size?: RankBadgeSize
  className?: string
}

const ICON_BY_RANK: Record<PlayerRankKey, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  bronze: BronzeIcon,
  silver: SilverIcon,
  gold: GoldIcon,
  diamond: DiamondIcon,
  legend: LegendIcon,
}

const ICON_SIZE_CLASSES: Record<RankBadgeSize, string> = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-12 h-12',
}

const LABEL_SIZE_CLASSES: Record<RankBadgeSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

/**
 * Affiche le rang d'un joueur — icône SVG + label optionnel.
 *
 * Exemples :
 *   <RankBadge rank="bronze" />                  → icône seule (24px)
 *   <RankBadge rank="gold" withLabel />          → icône + "Or"
 *   <RankBadge rank="diamond" size="lg" withLabel /> → grand format (page profil)
 *
 * Couleurs : DESIGN.md §11 + src/config/ranks.ts.
 */
export function RankBadge({
  rank,
  withLabel = false,
  size = 'md',
  className,
}: RankBadgeProps) {
  const tier = RANK_TIERS.find((t) => t.key === rank)
  if (!tier) return null

  const Icon = ICON_BY_RANK[rank]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 align-middle',
        className,
      )}
      title={tier.label}
    >
      <Icon className={ICON_SIZE_CLASSES[size]} aria-hidden="true" />
      {withLabel && (
        <span
          className={cn(
            'font-semibold uppercase tracking-wider',
            LABEL_SIZE_CLASSES[size],
          )}
          style={{ color: tier.color }}
        >
          {tier.label}
        </span>
      )}
    </span>
  )
}