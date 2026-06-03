import { notFound } from 'next/navigation'

export default function Page() {
  notFound()
}
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { FCFA } from '@/components/shared/FCFA'
import { PaymentMethodIcon } from '@/components/shared/PaymentMethodIcon'
import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { cn } from '@/lib/utils'

import { PaymentVerificationCard } from '../../paiements/components/PaymentVerificationCard'
import { REGISTRATION_STATUS_META } from '../components/RegistrationsTable'

import type { PendingPaymentRow } from '@/lib/payments/verify'
import type { Database } from '@/types/database.types'

type PaymentMethod = Database['public']['Enums']['payment_method']

export const metadata = {
  title: 'Détail inscription — Admin',
  robots: { index: false, follow: false },
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  mtn_mobile_money: 'MTN Mobile Money',
  airtel_money: 'Airtel Money',
  cash: 'Espèces',
}

const PAYMENT_STATUS_META: Record<
  Database['public']['Enums']['payment_status'],
  { label: string; className: string }
> = {
  pending: { label: 'En attente', className: 'bg-warning/15 text-warning' },
  confirmed: {
    label: 'Confirmé',
    className: 'bg-success-neon/15 text-success-neon',
  },
  rejected: { label: 'Rejeté', className: 'bg-danger/15 text-danger' },
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Détail d'une inscription (M10).
 *
 * Affiche le joueur, le statut, le numéro de badge et l'historique des
 * paiements. Pour un paiement en attente, réutilise PaymentVerificationCard
 * (confirm/reject) ; le rafraîchissement de la route met à jour cette page.
 */
export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const supabase = createServiceRoleClient()

  const { data: registration } = await supabase
    .from('registrations')
    .select(
      `id, status, badge_number, registered_via, created_at, confirmed_at,
       rejected_at, cancelled_at, player_id,
       profiles!registrations_player_id_fkey ( pseudo, phone, first_name, last_name )`,
    )
    .eq('id', id)
    .maybeSingle()

  if (!registration) notFound()

  const profile = registration.profiles as unknown as {
    pseudo: string
    phone: string
    first_name: string | null
    last_name: string | null
  } | null

  const { data: payments } = await supabase
    .from('payments')
    .select(
      `id, method, amount_fcfa, status, transaction_ref, sender_name,
       sender_phone, proof_file_url, submitted_at, rejection_reason`,
    )
    .eq('registration_id', id)
    .order('submitted_at', { ascending: false })

  const paymentList = payments ?? []
  const pending = paymentList.find((p) => p.status === 'pending')

  const statusMeta = REGISTRATION_STATUS_META[registration.status]
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={ROUTES.admin.registrations.root}>
          <ChevronLeft aria-hidden />
          Retour aux inscriptions
        </Link>
      </Button>

      {/* En-tête */}
      <header className="rounded-xl border border-border bg-surface-1 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <PlayerPseudo pseudo={profile?.pseudo ?? '—'} size="lg" />
            {fullName && (
              <p className="mt-1 text-sm text-text-secondary">{fullName}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn('border-transparent', statusMeta.className)}
          >
            {statusMeta.label}
          </Badge>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Badge">
            <span className="text-2xl font-bold tabular-nums text-text-primary">
              {registration.badge_number ?? '—'}
            </span>
          </Info>
          <Info label="Téléphone">{profile?.phone || '—'}</Info>
          <Info label="Origine">
            {registration.registered_via === 'manual' ? 'Sur place' : 'En ligne'}
          </Info>
          <Info label="Inscrit le">
            {dateFormatter.format(new Date(registration.created_at))}
          </Info>
        </dl>
      </header>

      {/* Vérification du paiement en attente */}
      {pending && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Paiement à vérifier
          </h2>
          <PaymentVerificationCard
            payment={toPendingRow(pending, registration.id, registration.player_id, profile)}
          />
        </section>
      )}

      {/* Historique des paiements */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">
          Historique des paiements
        </h2>
        {paymentList.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface-1 p-5 text-sm text-text-secondary">
            Aucun paiement enregistré pour cette inscription.
          </p>
        ) : (
          <ul className="space-y-3">
            {paymentList.map((payment) => {
              const meta = PAYMENT_STATUS_META[payment.status]
              return (
                <li
                  key={payment.id}
                  className="rounded-xl border border-border bg-surface-1 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <PaymentMethodIcon method={payment.method} size="sm" />
                      <div>
                        <p className="text-sm text-text-primary">
                          {METHOD_LABELS[payment.method]}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {dateFormatter.format(new Date(payment.submitted_at))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FCFA
                        amount={payment.amount_fcfa}
                        className="text-text-primary"
                      />
                      <Badge
                        variant="outline"
                        className={cn('border-transparent', meta.className)}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                  {payment.status === 'rejected' && payment.rejection_reason && (
                    <p className="mt-2 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
                      Motif du rejet : {payment.rejection_reason}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Info({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-text-secondary">
        {label}
      </dt>
      <dd className="mt-1 text-text-primary">{children}</dd>
    </div>
  )
}

/** Adapte une ligne paiement DB au format attendu par PaymentVerificationCard. */
function toPendingRow(
  payment: {
    id: string
    method: PaymentMethod
    amount_fcfa: number
    transaction_ref: string | null
    sender_name: string | null
    sender_phone: string | null
    proof_file_url: string | null
    submitted_at: string
  },
  registrationId: string,
  playerId: string,
  profile: { pseudo: string; phone: string } | null,
): PendingPaymentRow {
  return {
    id: payment.id,
    registrationId,
    playerId,
    pseudo: profile?.pseudo ?? '—',
    phone: profile?.phone ?? '',
    method: payment.method,
    amountFcfa: payment.amount_fcfa,
    senderPhone: payment.sender_phone,
    senderName: payment.sender_name,
    transactionRef: payment.transaction_ref,
    hasProof: Boolean(payment.proof_file_url),
    submittedAt: payment.submitted_at,
  }
}