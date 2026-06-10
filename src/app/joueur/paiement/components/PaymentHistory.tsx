import { FCFA } from '@/components/shared/FCFA'
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '@/lib/payments/methods'
import type { PlayerPaymentSummary } from '@/lib/payments/submit-proof'

/**
 * Historique des paiements du joueur pour la réservation active.
 *
 * Affiche chaque tentative (méthode, montant, date, statut) et, pour un
 * paiement refusé, le motif comme « réponse de l'organisation ».
 * Données strictement joueur (aucune note interne / vérificateur). No-Line.
 */

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'En vérification', cls: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Confirmé', cls: 'bg-success-neon/10 text-success-neon' },
  rejected: { label: 'Refusé', cls: 'bg-danger/10 text-danger' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function PaymentHistory({
  payments,
}: {
  payments: PlayerPaymentSummary[]
}) {
  if (payments.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
        Historique des paiements
      </h2>
      <ul className="space-y-2">
        {payments.map((p) => {
          const meta =
            STATUS_META[p.status] ?? {
              label: p.status,
              cls: 'bg-surface-2 text-text-secondary',
            }
          const methodLabel =
            PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method

          return (
            <li key={p.id} className="rounded-2xl bg-surface-1 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text-primary">
                  {methodLabel}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.cls}`}
                >
                  {meta.label}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <FCFA amount={p.amount_fcfa} className="text-text-primary" />
                <span className="text-xs text-text-secondary">
                  {formatDate(p.submitted_at)}
                </span>
              </div>

              {p.transaction_ref ? (
                <p className="mt-1 font-mono text-xs text-text-secondary">
                  {"Réf : "}
                  {p.transaction_ref}
                </p>
              ) : null}

              {p.status === 'rejected' && p.rejection_reason ? (
                <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                  <span className="font-semibold">
                    {"Réponse de l'organisation : "}
                  </span>
                  {p.rejection_reason}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}