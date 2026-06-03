import Link from 'next/link'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

import type { Database } from '@/types/database.types'

type RegistrationStatus = Database['public']['Enums']['registration_status']

/**
 * Réservations sans badge attribué (M10) : inscriptions `reserved` ou
 * `awaiting_verification`. Le badge n'est posé qu'à la confirmation, donc ces
 * joueurs n'ont pas encore de numéro. Informational, lien vers le détail.
 */
export interface PendingReservation {
  id: string
  pseudo: string
  status: Extract<RegistrationStatus, 'reserved' | 'awaiting_verification'>
}

const STATUS_META: Record<
  PendingReservation['status'],
  { label: string; className: string }
> = {
  reserved: { label: 'Réservé', className: 'bg-surface-2 text-text-secondary' },
  awaiting_verification: {
    label: 'En vérification',
    className: 'bg-warning/15 text-warning',
  },
}

export function ReservationPanel({
  reservations,
}: {
  reservations: PendingReservation[]
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-1 p-5">
      <h2 className="text-sm font-semibold text-text-primary">
        En attente de badge
      </h2>
      <p className="mt-1 text-xs text-text-secondary">
        Le numéro est attribué automatiquement à la confirmation du paiement.
      </p>

      {reservations.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          Aucune réservation en attente.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {reservations.map((reservation) => {
            const meta = STATUS_META[reservation.status]
            return (
              <li key={reservation.id}>
                <Link
                  href={ROUTES.admin.registrations.detail(reservation.id)}
                  className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
                >
                  <PlayerPseudo pseudo={reservation.pseudo} size="xs" />
                  <Badge
                    variant="outline"
                    className={cn('border-transparent', meta.className)}
                  >
                    {meta.label}
                  </Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}