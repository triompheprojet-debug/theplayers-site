import { Banknote } from 'lucide-react'

import { FCFA } from '@/components/shared/FCFA'

import type { RevenueBreakdown } from '@/lib/payments/revenue'

/**
 * Revenus confirmés du tournoi actif + répartition par méthode (Règle 3).
 * Graphe en barres % calculées sur les vrais montants. Données internes (admin).
 */
export function RevenuesCard({ revenue }: { revenue: RevenueBreakdown }) {
  const total = revenue.total
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  const bars = [
    { label: 'MTN Mobile Money', value: revenue.mtn },
    { label: 'Airtel Money', value: revenue.airtel },
    { label: 'Espèces', value: revenue.cash },
  ]

  return (
    <section className="rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center gap-2">
        <Banknote className="size-4 text-success-neon" aria-hidden />
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
          Revenus cumulés
        </h2>
      </div>

      <div className="mt-3">
        <FCFA amount={total} large neon className="text-3xl" />
        <p className="mt-1 text-xs text-text-secondary">
          {revenue.confirmedCount} paiement
          {revenue.confirmedCount === 1 ? '' : 's'} confirmé
          {revenue.confirmedCount === 1 ? '' : 's'}
        </p>
      </div>

      <ul className="mt-5 space-y-3">
        {bars.map((bar) => {
          const p = pct(bar.value)
          return (
            <li key={bar.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-text-secondary">{bar.label}</span>
                <span className="font-mono tabular-nums text-text-primary">
                  {p} %
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={p}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={bar.label}
                className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full bg-accent-violet"
                  style={{ width: `${p}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}