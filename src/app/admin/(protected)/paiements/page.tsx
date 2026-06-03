import { EmptyState } from '@/components/shared/EmptyState'
import { requireAdmin } from '@/lib/auth/permissions'
import { listPendingPayments } from '@/lib/payments/verify'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { PaymentsToVerifyList } from './components/PaymentsToVerifyList'
import { VerificationGuideModal } from './components/VerificationGuideModal'

export const metadata = {
  title: 'Paiements à traiter — Admin',
  robots: { index: false, follow: false },
}

/**
 * Page de vérification des preuves de paiement (M10).
 *
 * Server Component : lit le tournoi actif + la file d'attente (service_role).
 * Les coordonnées officielles (numéros MTN/Airtel) alimentent le guide de
 * vérification — visibles admin uniquement.
 */
export default async function AdminPaymentsPage() {
  await requireAdmin()

  const tournament = await getActiveTournamentForAdmin()

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader />
        <EmptyState
          title="Aucun tournoi actif"
          description="Sélectionnez un tournoi actif pour gérer ses paiements."
        />
      </div>
    )
  }

  const [pending, paymentConfig] = await Promise.all([
    listPendingPayments(tournament.id),
    Promise.resolve(readPaymentConfig(tournament.config)),
  ])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        count={pending.length}
        guide={<VerificationGuideModal {...paymentConfig} />}
      />
      <PaymentsToVerifyList initialPayments={pending} />
    </div>
  )
}

function PageHeader({
  count,
  guide,
}: {
  count?: number
  guide?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Vérification
        </p>
        <h1 className="text-2xl font-bold text-text-primary">
          Paiements à traiter
          {typeof count === 'number' && count > 0 && (
            <span className="ml-2 align-middle rounded-full bg-warning/15 px-2 py-0.5 text-sm font-semibold text-warning tabular-nums">
              {count}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Confirmez ou rejetez chaque preuve. Une confirmation attribue
          automatiquement le numéro de badge.
        </p>
      </div>
      {guide}
    </header>
  )
}

/** Lecture défensive de `config.payment.*` (jsonb non typé). */
function readPaymentConfig(config: unknown): {
  mtnNumber: string | null
  mtnHolder: string | null
  airtelNumber: string | null
  airtelHolder: string | null
} {
  const empty = {
    mtnNumber: null,
    mtnHolder: null,
    airtelNumber: null,
    airtelHolder: null,
  }
  if (config && typeof config === 'object' && 'payment' in config) {
    const payment = (config as { payment?: Record<string, unknown> }).payment
    if (payment && typeof payment === 'object') {
      return {
        mtnNumber: asString(payment.mtn_number),
        mtnHolder: asString(payment.mtn_holder_name),
        airtelNumber: asString(payment.airtel_number),
        airtelHolder: asString(payment.airtel_holder_name),
      }
    }
  }
  return empty
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}