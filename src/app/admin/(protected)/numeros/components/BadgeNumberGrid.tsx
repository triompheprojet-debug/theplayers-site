import { cn } from '@/lib/utils'

/**
 * Grille des numéros de badge du tournoi actif (M10).
 *
 * Affiche les numéros de 1 à capacité ; les numéros attribués portent le
 * pseudo du joueur. Page admin uniquement (la capacité reste confidentielle
 * vis-à-vis du public — Règle 1).
 */
export interface BadgeAssignment {
  badgeNumber: number
  pseudo: string
}

interface BadgeNumberGridProps {
  assignments: BadgeAssignment[]
  capacity: number | null
}

export function BadgeNumberGrid({
  assignments,
  capacity,
}: BadgeNumberGridProps) {
  const byNumber = new Map(assignments.map((a) => [a.badgeNumber, a.pseudo]))

  // Borne d'affichage : capacité si définie, sinon le plus grand numéro attribué.
  const maxAssigned = assignments.reduce(
    (max, a) => Math.max(max, a.badgeNumber),
    0,
  )
  const upperBound = capacity && capacity > 0 ? capacity : maxAssigned

  if (upperBound === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface-1 p-5 text-sm text-text-secondary">
        Aucun numéro de badge attribué pour l’instant.
      </p>
    )
  }

  const numbers = Array.from({ length: upperBound }, (_, i) => i + 1)

  return (
    <div>
      <p className="mb-3 text-sm text-text-secondary">
        {assignments.length} attribué{assignments.length === 1 ? '' : 's'}
        {capacity ? ` / ${capacity}` : ''}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {numbers.map((number) => {
          const pseudo = byNumber.get(number)
          const assigned = Boolean(pseudo)
          return (
            <div
              key={number}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3',
                assigned
                  ? 'border-success-neon/30 bg-success-neon/5'
                  : 'border-border bg-surface-1',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-bold tabular-nums',
                  assigned
                    ? 'bg-success-neon/15 text-success-neon'
                    : 'bg-surface-2 text-text-muted',
                )}
              >
                {number}
              </span>
              <span
                className={cn(
                  'min-w-0 truncate text-sm',
                  assigned ? 'text-text-primary' : 'text-text-muted',
                )}
                title={pseudo ?? undefined}
              >
                {pseudo ?? 'Libre'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}