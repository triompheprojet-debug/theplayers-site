import { Crown } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { TournamentStandingRow } from '@/lib/historique/get'

/** Couleur de médaille selon la position (or / argent / bronze). */
function medalColor(position: number): string {
  if (position === 1) return '#f5c518'
  if (position === 2) return '#c0c6cc'
  if (position === 3) return '#cd7f32'
  return '#71717a'
}

function PodiumColumn({
  entry,
  height,
  isFirst = false,
}: {
  entry: TournamentStandingRow | undefined
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
      <p className="mb-1.5 text-xs text-text-secondary">{entry.roundLabel}</p>
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
 * Résultats figés d'un tournoi (détail d'une édition hors-saison) : podium des
 * 3 premiers + liste des suivants, par palier (pas de points ni de rang ici).
 */
export function TournamentResults({ rows }: { rows: TournamentStandingRow[] }) {
  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <>
      <div className="mb-5 flex items-end justify-center gap-2">
        <PodiumColumn entry={top3[1]} height="60px" />
        <PodiumColumn entry={top3[0]} height="84px" isFirst />
        <PodiumColumn entry={top3[2]} height="46px" />
      </div>

      {rest.length > 0 && (
        <ul className="flex flex-col gap-1">
          {rest.map((row, index) => (
            <li
              key={`${row.position}-${row.pseudo}`}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5',
                index % 2 === 0 ? 'bg-surface-1' : 'bg-surface-2',
              )}
            >
              <span className="w-6 shrink-0 text-center text-sm text-text-muted">
                {row.position}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                {row.pseudo}
              </span>
              <span className="shrink-0 text-xs text-text-secondary">
                {row.roundLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}