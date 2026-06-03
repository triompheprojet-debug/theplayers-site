import { Banknote } from 'lucide-react'

import { FCFA } from '@/components/shared/FCFA'

import type { RevenueBreakdown } from '@/lib/payments/revenue'

/**
 * Carte des revenus confirmés du tournoi actif (M10).
 * Ventilation par méthode (Règle 3 : libellés stricts). Données financières
 * internes → admin uniquement.
 */
export function RevenuesCard({ revenue }: { revenue: RevenueBreakdown }) {
  const rows: { label: string; amount: number }[] = [
    { label: 'MTN Mobile Money', amount: revenue.mtn },
    { label: 'Airtel Money', amount: revenue.airtel },
    { label: 'Espèces', amount: revenue.cash },
  ]

  return (
    <section className="rounded-xl bg-surface-1 border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Banknote className="size-4 text-success-neon" aria-hidden />
        <h2 className="text-sm font-semibold text-text-primary">
          Revenus confirmés
        </h2>
      </div>

      <div>
        <FCFA amount={revenue.total} large neon />
        <p className="mt-1 text-xs text-text-secondary">
          {revenue.confirmedCount} paiement
          {revenue.confirmedCount === 1 ? '' : 's'} confirmé
          {revenue.confirmedCount === 1 ? '' : 's'}
        </p>
      </div>

      <ul className="space-y-2 border-t border-border pt-3">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-text-secondary">{row.label}</span>
            <FCFA amount={row.amount} className="text-text-primary" />
          </li>
        ))}
      </ul>
    </section>
  )
}