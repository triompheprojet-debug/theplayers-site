import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

import type { Database } from '@/types/database.types'

type RegistrationStatus = Database['public']['Enums']['registration_status']

export interface RegistrationListRow {
  id: string
  pseudo: string
  phone: string
  status: RegistrationStatus
  badgeNumber: number | null
  registeredVia: string
  createdAt: string
}

/** Libellé + classe couleur par statut (tokens projet). */
export const REGISTRATION_STATUS_META: Record<
  RegistrationStatus,
  { label: string; className: string }
> = {
  reserved: {
    label: 'Réservé',
    className: 'bg-surface-2 text-text-secondary',
  },
  awaiting_verification: {
    label: 'En vérification',
    className: 'bg-warning/15 text-warning',
  },
  confirmed: {
    label: 'Confirmé',
    className: 'bg-success-neon/15 text-success-neon',
  },
  rejected: { label: 'Rejeté', className: 'bg-danger/15 text-danger' },
  cancelled: { label: 'Annulé', className: 'bg-surface-2 text-text-muted' },
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const VIA_LABELS: Record<string, string> = {
  online: 'En ligne',
  manual: 'Sur place',
}

export function RegistrationsTable({
  rows,
}: {
  rows: RegistrationListRow[]
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Aucune inscription"
        description="Aucune inscription ne correspond à ces filtres."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-1 text-left">
            <Th>Joueur</Th>
            <Th>Téléphone</Th>
            <Th>Statut</Th>
            <Th>Badge</Th>
            <Th>Origine</Th>
            <Th>Date</Th>
            <th className="px-4 py-3" aria-label="Détail" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const meta = REGISTRATION_STATUS_META[row.status]
            return (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-surface-1/60"
              >
                <td className="px-4 py-3">
                  <PlayerPseudo pseudo={row.pseudo} size="xs" />
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {row.phone || '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={cn('border-transparent', meta.className)}
                  >
                    {meta.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {row.badgeNumber ?? '—'}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {VIA_LABELS[row.registeredVia] ?? row.registeredVia}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-secondary">
                  {dateFormatter.format(new Date(row.createdAt))}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={ROUTES.admin.registrations.detail(row.id)}
                    className="inline-flex items-center text-accent-violet hover:underline"
                    aria-label="Voir le détail"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
      {children}
    </th>
  )
}