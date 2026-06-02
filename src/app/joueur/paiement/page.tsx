import { CalendarOff } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { getActivePaymentInfo } from '@/lib/config/tournament-config'
import { getLatestPaymentForRegistration } from '@/lib/payments/submit-proof'
import { getPlayerRegistrationForActive } from '@/lib/registrations/create'
import { createClient } from '@/lib/supabase/server'

import { PaymentMethodCards } from './components/PaymentMethodCards'
import { PaymentProofForm } from './components/PaymentProofForm'
import { PaymentStatusBanner } from './components/PaymentStatusBanner'

/**
 * Page paiement joueur.
 *
 * États :
 *   - Pas de réservation → invite à s'inscrire.
 *   - Réservation confirmée → bandeau « confirmé », pas de formulaire.
 *   - Paiement déjà soumis (pending/rejected) → bandeau de statut ; si rejeté,
 *     on laisse re-soumettre.
 *   - Réservation reserved sans paiement → cartes + formulaire.
 *
 * Les numéros MTN/Airtel et le montant viennent de la config serveur du
 * tournoi actif (Règle 11) — jamais en dur, jamais via la RPC publique.
 */
export default async function PlayerPaymentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const registration = await getPlayerRegistrationForActive(user.id)

  // Aucune réservation pour le tournoi actif
  if (!registration) {
    return (
      <div className="space-y-6">
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

  const payment = await getLatestPaymentForRegistration(
    user.id,
    registration.id,
  )

  // Réservation déjà confirmée → plus rien à payer
  if (registration.status === 'confirmed') {
    return (
      <div className="space-y-6">
        <PageHeader />
        <PaymentStatusBanner status="confirmed" method={payment?.method ?? ''} />
      </div>
    )
  }

  const paymentInfo = await getActivePaymentInfo()
  const amount = paymentInfo?.registration?.amount_fcfa ?? null

  // Paiement en attente → bandeau seul (pas de re-soumission)
  if (payment && payment.status === 'pending') {
    return (
      <div className="space-y-6">
        <PageHeader />
        <PaymentStatusBanner status="pending" method={payment.method} />
      </div>
    )
  }

  // Sinon : reserved sans paiement, OU paiement rejeté → cartes + formulaire
  return (
    <div className="space-y-6">
      <PageHeader />

      {payment && payment.status === 'rejected' && (
        <PaymentStatusBanner
          status="rejected"
          method={payment.method}
          rejectionReason={payment.rejection_reason}
        />
      )}

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
    </div>
  )
}

function PageHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold text-text-primary">Paiement</h1>
      <p className="text-sm text-text-secondary">
        Règle ton inscription et soumets ta preuve de paiement.
      </p>
    </header>
  )
}