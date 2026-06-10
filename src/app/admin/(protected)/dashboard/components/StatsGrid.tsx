import { cn } from '@/lib/utils'

/**
 * Grille KPI d'inscriptions du tournoi actif.
 * Composant présentationnel : reçoit les compteurs déjà calculés.
 */
export interface RegistrationStats {
  total: number
  reserved: number
  awaitingVerification: number
  confirmed: number
  rejected: number
}

interface StatItem {
  label: string
  value: number
  accent: string
}

export function StatsGrid({ stats }: { stats: RegistrationStats }) {
  const items: StatItem[] = [
    { label: 'Total inscrits', value: stats.total, accent: 'text-text-primary' },
    { label: 'Confirmés', value: stats.confirmed, accent: 'text-success-neon' },
    {
      label: 'En attente',
      value: stats.awaitingVerification,
      accent: 'text-warning',
    },
    { label: 'Rejetés', value: stats.rejected, accent: 'text-danger' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-surface-1 p-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
            {item.label}
          </p>
          <p
            className={cn(
              'mt-3 font-mono text-4xl font-bold tabular-nums',
              item.accent,
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}