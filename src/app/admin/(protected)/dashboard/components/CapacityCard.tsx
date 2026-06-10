import { ConfidentialNotice } from '@/components/shared/ConfidentialNotice'

/**
 * Capacité du tournoi actif (Règle 1 — confidentielle, back-office uniquement).
 * Accent admin rouge + jauge orange. `occupied` = inscriptions actives.
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
    <section className="relative overflow-hidden rounded-2xl bg-surface-1 p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-admin before:content-['']">
      <ConfidentialNotice message="Capacité serveur — ne jamais communiquer publiquement (Règle 1)." />

      {hasCapacity ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-end justify-between gap-4">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
              Capacité serveur
            </p>
            <p className="font-mono tabular-nums text-text-primary">
              <span className="text-2xl font-bold">{occupied}</span>
              <span className="text-text-secondary"> / {capacity}</span>
            </p>
          </div>

          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Taux de remplissage"
            className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className="h-full rounded-full bg-warning"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="text-xs text-text-secondary">
            {percent} % occupé · {remaining} place{remaining === 1 ? '' : 's'}{' '}
            restante{remaining === 1 ? '' : 's'}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-text-secondary">
          Aucune capacité définie pour ce tournoi.
        </p>
      )}
    </section>
  )
}