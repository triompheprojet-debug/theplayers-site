import { RankBadge } from '@/components/shared/RankBadge'
import { cn } from '@/lib/utils'

import type { LeaderboardEntry } from '@/lib/standings/leaderboard'

/**
 * Table du classement (rangs 4 et suivants). Séparation par tons de surface
 * alternés (No-Line). Pseudo + RankBadge + points.
 */
export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {entries.map((entry, index) => (
        <li
          key={`${entry.position}-${entry.pseudo}`}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5',
            index % 2 === 0 ? 'bg-surface-1' : 'bg-surface-2',
          )}
        >
          <span className="w-6 shrink-0 text-center text-sm text-text-muted">
            {entry.position}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
            {entry.pseudo}
          </span>
          <RankBadge rank={entry.rank} withLabel size="sm" />
          <span className="min-w-14 shrink-0 text-right text-sm text-text-primary">
            {entry.totalPoints.toLocaleString('fr-FR')} pts
          </span>
        </li>
      ))}
    </ul>
  )
}