import { cn } from '@/lib/utils'

type TournamentType = 'off_season' | 'season' | 'grand_final'

interface TournamentTypeBadgeProps {
  type: TournamentType
  className?: string
}

const BADGE_CONFIG: Record<
  TournamentType,
  { label: string; classes: string }
> = {
  off_season: {
    label: 'Hors Saison',
    classes: 'bg-surface-2 text-text-secondary',
  },
  season: {
    label: 'Saison',
    classes: 'bg-accent-violet/20 text-accent-violet',
  },
  grand_final: {
    label: 'Grande Finale',
    classes:
      'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 font-bold',
  },
}

/**
 * Badge identifiant le type de tournoi (DESIGN.md §11).
 *
 * Style UPPERCASE + letter-spacing (Règle 10 : labels signature en majuscules).
 */
export function TournamentTypeBadge({
  type,
  className,
}: TournamentTypeBadgeProps) {
  const { label, classes } = BADGE_CONFIG[type]

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full',
        'text-xs uppercase tracking-wider font-semibold',
        classes,
        className,
      )}
    >
      {label}
    </span>
  )
}