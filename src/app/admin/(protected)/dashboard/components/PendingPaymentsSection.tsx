import Link from 'next/link'
import { ArrowRight, CreditCard } from 'lucide-react'

import { FCFA } from '@/components/shared/FCFA'
import { PaymentMethodIcon } from '@/components/shared/PaymentMethodIcon'
import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

import type { PendingPaymentRow } from '@/lib/payments/verify'

/**
 * Aperçu "paiements à traiter" (lecture seule). La validation
 * (confirmer/rejeter) vit sur /admin/paiements (M10) — lien « Tout voir ».
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
    <section className="rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-warning" aria-hidden />
          <h2 className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
            Paiements à traiter
          </h2>
        </div>
        {count > 0 && (
          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-warning">
            {count} en file
          </span>
        )}
      </div>

      {count === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          Aucune preuve de paiement en attente.
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-surface-2">
            {preview.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center gap-3 py-3 first:pt-0"
              >
                <PaymentMethodIcon method={payment.method} size="sm" />
                <div className="min-w-0 flex-1">
                  <PlayerPseudo pseudo={payment.pseudo} size="xs" />
                  {payment.transactionRef && (
                    <p className="truncate font-mono text-xs text-text-secondary">
                      Réf. {payment.transactionRef}
                    </p>
                  )}
                </div>
                <FCFA
                  amount={payment.amountFcfa}
                  className="text-text-primary"
                />
              </li>
            ))}
          </ul>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mt-4 w-full justify-center"
          >
            <Link href={ROUTES.admin.payments}>
              Tout voir
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </>
      )}
    </section>
  )
}