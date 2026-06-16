import { Crown } from 'lucide-react'

import type { LeaderboardEntry } from '@/lib/standings/leaderboard'

/** Couleur de médaille selon la position (or / argent / bronze). */
function medalColor(position: number): string {
  if (position === 1) return '#f5c518'
  if (position === 2) return '#c0c6cc'
  return '#cd7f32'
}

function PodiumColumn({
  entry,
  height,
  isFirst = false,
}: {
  entry: LeaderboardEntry | undefined
  height: string
  isFirst?: boolean
}) {
  if (!entry) return <div className="flex-1" aria-hidden />

  return (
    <div className="flex-1 text-center">
      {isFirst && (
        <Crown
          className="mx-auto mb-0.5 size-5"
          style={{ color: medalColor(1) }}
          aria-hidden
        />
      )}
      <p className="truncate text-sm font-medium text-text-primary">
        {entry.pseudo}
      </p>
      <p className="mb-1.5 text-xs text-text-secondary">
        {entry.totalPoints.toLocaleString('fr-FR')} pts
      </p>
      <div
        className="flex items-center justify-center rounded-t-xl bg-surface-2"
        style={{ height }}
      >
        <span
          className="text-2xl font-semibold"
          style={{ color: medalColor(entry.position) }}
        >
          {entry.position}
        </span>
      </div>
    </div>
  )
}

/**
 * Podium des 3 premiers (disposition 2 · 1 · 3, le 1er surélevé).
 * Pseudos + points uniquement (Règle 2). Tolère moins de 3 joueurs.
 */
export function PodiumTop3({ entries }: { entries: LeaderboardEntry[] }) {
  const first = entries[0]
  const second = entries[1]
  const third = entries[2]

  return (
    <div className="mb-5 flex items-end justify-center gap-2">
      <PodiumColumn entry={second} height="62px" />
      <PodiumColumn entry={first} height="88px" isFirst />
      <PodiumColumn entry={third} height="48px" />
    </div>
  )
}