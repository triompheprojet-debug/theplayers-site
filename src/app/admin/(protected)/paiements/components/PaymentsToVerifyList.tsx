'use client'

import { useState } from 'react'
import { CheckCheck } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

import { PaymentVerificationCard } from './PaymentVerificationCard'

import type { PendingPaymentRow } from '@/lib/payments/verify'

/**
 * Liste des paiements à vérifier (M10).
 *
 * Retrait optimiste : dès qu'un paiement est confirmé/rejeté, on le retire
 * localement (la revalidation serveur déclenchée par l'action garde la liste
 * cohérente au prochain rendu).
 */
export function PaymentsToVerifyList({
  initialPayments,
}: {
  initialPayments: PendingPaymentRow[]
}) {
  const [payments, setPayments] = useState(initialPayments)

  function handleResolved(paymentId: string) {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId))
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CheckCheck}
        title="Aucune preuve en attente"
        description="Toutes les preuves de paiement ont été traitées."
      />
    )
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <PaymentVerificationCard
          key={payment.id}
          payment={payment}
          onResolved={handleResolved}
        />
      ))}
    </div>
  )
}