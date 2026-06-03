import { Users } from 'lucide-react'

import { ConfidentialNotice } from '@/components/shared/ConfidentialNotice'
import { Progress } from '@/components/ui/progress'

/**
 * Carte de capacité du tournoi actif (M10).
 *
 * Règle 1 — la capacité est CONFIDENTIELLE : cette carte n'apparaît QUE dans
 * le back-office admin. Elle n'est jamais rendue côté public/joueur.
 *
 * `occupied` = inscriptions actives (reserved + awaiting_verification + confirmed).
 */
interface CapacityCardProps {
  capacity: number | null
  occupied: number
}

export function CapacityCard({ capacity, occupied }: CapacityCardProps) {
  const hasCapacity = capacity != null && capacity > 0
  const percent = hasCapacity
    ? Math.min(100, Math.round((occupied / capacity) * 100))
    : 0
  const remaining = hasCapacity ? Math.max(0, capacity - occupied) : null

  return (
    <section className="rounded-xl bg-surface-1 border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-accent-violet" aria-hidden />
        <h2 className="text-sm font-semibold text-text-primary">
          Capacité du tournoi
        </h2>
      </div>

      {hasCapacity ? (
        <>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold tabular-nums text-text-primary">
              {occupied}
              <span className="text-base font-normal text-text-secondary">
                {' '}
                / {capacity}
              </span>
            </p>
            <p className="text-sm text-text-secondary">
              {remaining} place{remaining === 1 ? '' : 's'} restante
              {remaining === 1 ? '' : 's'}
            </p>
          </div>

          <Progress value={percent} aria-label="Taux de remplissage" />
          <p className="text-xs text-text-secondary">{percent} % occupé</p>
        </>
      ) : (
        <p className="text-sm text-text-secondary">
          Aucune capacité définie pour ce tournoi.
        </p>
      )}

      <ConfidentialNotice message="Capacité confidentielle — ne jamais communiquer publiquement (Règle 1)." />
    </section>
  )
}