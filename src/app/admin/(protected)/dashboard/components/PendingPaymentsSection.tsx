import Link from 'next/link'
import { ArrowRight, CreditCard } from 'lucide-react'

import { FCFA } from '@/components/shared/FCFA'
import { PaymentMethodIcon } from '@/components/shared/PaymentMethodIcon'
import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

import type { PendingPaymentRow } from '@/lib/payments/verify'

/**
 * Aperçu "paiements à traiter" sur le dashboard (M10).
 * Affiche les premières preuves en attente + lien vers la page complète.
 */
interface PendingPaymentsSectionProps {
  count: number
  preview: PendingPaymentRow[]
}

export function PendingPaymentsSection({
  count,
  preview,
}: PendingPaymentsSectionProps) {
  return (
    <section className="rounded-xl bg-surface-1 border border-border p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-warning" aria-hidden />
          <h2 className="text-sm font-semibold text-text-primary">
            Paiements à traiter
          </h2>
          {count > 0 && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning tabular-nums">
              {count}
            </span>
          )}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.admin.payments}>
            Tout voir
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      {count === 0 ? (
        <p className="text-sm text-text-secondary">
          Aucune preuve de paiement en attente.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {preview.map((payment) => (
            <li
              key={payment.id}
              className="flex items-center gap-3 py-2.5 first:pt-0"
            >
              <PaymentMethodIcon method={payment.method} size="sm" />
              <div className="min-w-0 flex-1">
                <PlayerPseudo pseudo={payment.pseudo} size="xs" />
                {payment.transactionRef && (
                  <p className="truncate text-xs text-text-secondary">
                    Réf. {payment.transactionRef}
                  </p>
                )}
              </div>
              <FCFA amount={payment.amountFcfa} className="text-text-primary" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}