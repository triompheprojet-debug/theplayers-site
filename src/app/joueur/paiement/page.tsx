import { CalendarOff, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FCFA } from '@/components/shared/FCFA'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { getActivePaymentInfo } from '@/lib/config/tournament-config'
import { listPaymentsForRegistration } from '@/lib/payments/submit-proof'
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '@/lib/payments/methods'
import { getPlayerRegistrationForActive } from '@/lib/registrations/create'
import { createClient } from '@/lib/supabase/server'

import { PaymentHistory } from './components/PaymentHistory'
import { PaymentMethodCards } from './components/PaymentMethodCards'
import { PaymentProofForm } from './components/PaymentProofForm'
import { PaymentStatusBanner } from './components/PaymentStatusBanner'

/**
 * Page paiement joueur (espace finance).
 *
 * Structure :
 *  - Bandeau de statut (à payer / en vérification / confirmé / refusé).
 *  - Zone de paiement (montant + comptes + formulaire) UNIQUEMENT si une
 *    action est attendue (pas encore payé, ou dernier paiement refusé).
 *  - Récap quand un paiement est en attente de vérification.
 *  - Historique de tous les paiements + réponses de l'organisation (motifs).
 *
 * Numéros MTN/Airtel et montant : config serveur du tournoi actif (Règle 11),
 * jamais en dur, jamais via la RPC publique.
 */
export default async function PlayerPaymentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const registration = await getPlayerRegistrationForActive(user.id)

  if (!registration) {
    return (
      <div className="space-y-6 px-4 py-6">
        <PageHeader />
        <section className="rounded-2xl bg-surface-1 p-5">
          <div className="flex items-start gap-3">
            <CalendarOff
              className="mt-0.5 h-6 w-6 shrink-0 text-text-muted"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-text-primary">
                  Aucune réservation
                </h2>
                <p className="text-sm text-text-secondary">
                  Tu dois d&apos;abord réserver ta place pour pouvoir payer.
                </p>
              </div>
              <Button
                asChild
                className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
              >
                <Link href={ROUTES.player.registration}>S&apos;inscrire</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const [payments, paymentInfo] = await Promise.all([
    listPaymentsForRegistration(user.id, registration.id),
    getActivePaymentInfo(),
  ])

  const latest = payments[0] ?? null
  const amount = paymentInfo?.registration?.amount_fcfa ?? null

  const isConfirmed = registration.status === 'confirmed'
  const isPending = latest?.status === 'pending'
  const isRejected = latest?.status === 'rejected'
  // Action attendue : ni confirmé, ni en attente de vérification
  // (donc : aucune preuve encore soumise, ou dernière preuve refusée).
  const needsAction = !isConfirmed && !isPending

  return (
    <div className="space-y-6 px-4 py-6">
      <PageHeader />

      {/* Bandeau de statut */}
      {isConfirmed ? (
        <PaymentStatusBanner status="confirmed" method={latest?.method ?? ''} />
      ) : isPending ? (
        <PaymentStatusBanner status="pending" method={latest?.method ?? ''} />
      ) : isRejected ? (
        <PaymentStatusBanner
          status="rejected"
          method={latest?.method ?? ''}
          rejectionReason={latest?.rejection_reason}
        />
      ) : (
        <PaymentStatusBanner status="unpaid" method="" />
      )}

      {/* Confirmé → accès aux documents */}
      {isConfirmed ? (
        <Button
          asChild
          className="min-h-12 w-full bg-surface-2 text-text-primary hover:bg-surface-3"
        >
          <Link href={ROUTES.player.documents}>
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            Voir mes documents
          </Link>
        </Button>
      ) : null}

      {/* En attente → récap, pas de re-soumission */}
      {isPending ? (
        <div className="space-y-3 rounded-2xl bg-surface-1 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-wider text-text-secondary">
              Méthode
            </span>
            <span className="font-semibold text-text-primary">
              {PAYMENT_METHOD_LABELS[latest?.method as PaymentMethod] ??
                latest?.method}
            </span>
          </div>
          {amount != null ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wider text-text-secondary">
                Montant
              </span>
              <FCFA amount={amount} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Zone de paiement (à payer ou après un refus) */}
      {needsAction ? (
        <>
          <PaymentMethodCards
            mtnNumber={paymentInfo?.payment?.mtn_number ?? null}
            mtnHolder={paymentInfo?.payment?.mtn_holder_name ?? null}
            airtelNumber={paymentInfo?.payment?.airtel_number ?? null}
            airtelHolder={paymentInfo?.payment?.airtel_holder_name ?? null}
            amountFcfa={amount}
          />
          <div className="rounded-2xl bg-surface-1 p-5">
            <PaymentProofForm
              registrationId={registration.id}
              defaultAmount={amount}
            />
          </div>
        </>
      ) : null}

      {/* Historique (toutes tentatives + réponses) */}
      <PaymentHistory payments={payments} />
    </div>
  )
}

function PageHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold text-accent-violet">Paiement</h1>
      <p className="text-sm text-text-secondary">
        Règle ton inscription, suis tes paiements et leurs réponses.
      </p>
    </header>
  )
}