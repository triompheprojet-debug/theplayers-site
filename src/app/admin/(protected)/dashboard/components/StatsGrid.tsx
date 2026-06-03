import {
  CheckCircle2,
  Clock,
  ClipboardList,
  Hourglass,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Grille de statistiques d'inscriptions du tournoi actif (M10).
 * Composant présentationnel : reçoit les compteurs déjà calculés.
 */
export interface RegistrationStats {
  total: number
  reserved: number
  awaitingVerification: number
  confirmed: number
}

interface StatItem {
  label: string
  value: number
  icon: LucideIcon
  accent: string
}

export function StatsGrid({ stats }: { stats: RegistrationStats }) {
  const items: StatItem[] = [
    {
      label: 'Inscrits (total actif)',
      value: stats.total,
      icon: ClipboardList,
      accent: 'text-accent-violet',
    },
    {
      label: 'Confirmés',
      value: stats.confirmed,
      icon: CheckCircle2,
      accent: 'text-success-neon',
    },
    {
      label: 'En vérification',
      value: stats.awaitingVerification,
      icon: Hourglass,
      accent: 'text-warning',
    },
    {
      label: 'Réservés',
      value: stats.reserved,
      icon: Clock,
      accent: 'text-text-secondary',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-surface-1 border border-border p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-text-secondary">
              {item.label}
            </p>
            <item.icon className={cn('size-4', item.accent)} aria-hidden />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}