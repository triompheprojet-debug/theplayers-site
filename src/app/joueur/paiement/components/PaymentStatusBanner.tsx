import { CheckCircle2, Clock, XCircle } from 'lucide-react'

interface PaymentStatusBannerProps {
  status: string
  method: string
  rejectionReason?: string | null
}

/**
 * Bandeau de statut de paiement.
 * Tokens : pending = warning (ambre), confirmed = success-neon, rejected = danger.
 */
export function PaymentStatusBanner({
  status,
  rejectionReason,
}: PaymentStatusBannerProps) {
  if (status === 'confirmed') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-success-neon/10 p-4">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-success-neon"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-semibold text-success-neon">Paiement confirmé</p>
          <p className="text-sm text-text-secondary">
            Ton inscription est validée. Rendez-vous sur ton tableau de bord.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-danger/10 p-4">
        <XCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-danger"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-semibold text-danger">Paiement refusé</p>
          <p className="text-sm text-text-secondary">
            {rejectionReason
              ? rejectionReason
              : 'Ta preuve n\'a pas pu être validée. Soumets une nouvelle preuve.'}
          </p>
        </div>
      </div>
    )
  }

  // pending (défaut)
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-warning/10 p-4">
      <Clock
        className="mt-0.5 h-5 w-5 shrink-0 text-warning"
        strokeWidth={2}
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-semibold text-warning">En cours de vérification</p>
        <p className="text-sm text-text-secondary">
          Ta preuve de paiement a bien été reçue. Elle est en cours de
          vérification par l&apos;organisation.
        </p>
      </div>
    </div>
  )
}