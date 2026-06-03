'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { FCFA } from '@/components/shared/FCFA'
import { PaymentMethodIcon } from '@/components/shared/PaymentMethodIcon'
import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import {
  confirmPaymentAction,
  getProofUrlAction,
  rejectPaymentAction,
} from '../actions'

import type { PendingPaymentRow } from '@/lib/payments/verify'

/** Libellés méthode côté client (methods.ts est server-only). Règle 3. */
const METHOD_LABELS: Record<PendingPaymentRow['method'], string> = {
  mtn_mobile_money: 'MTN Mobile Money',
  airtel_money: 'Airtel Money',
  cash: 'Espèces',
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

interface PaymentVerificationCardProps {
  payment: PendingPaymentRow
  /**
   * Appelé après résolution (confirm/reject). Optionnel : si absent (rendu
   * depuis un Server Component, ex. page détail), on rafraîchit la route.
   */
  onResolved?: (paymentId: string) => void
}

export function PaymentVerificationCard({
  payment,
  onResolved,
}: PaymentVerificationCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function resolve(paymentId: string) {
    if (onResolved) onResolved(paymentId)
    else router.refresh()
  }
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  // Aperçu preuve
  const [proofOpen, setProofOpen] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [proofLoading, setProofLoading] = useState(false)

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmPaymentAction(payment.id)
      if (result.success) {
        toast.success(
          result.data.badgeNumber != null
            ? `Paiement confirmé — badge n°${result.data.badgeNumber} attribué.`
            : 'Paiement confirmé.',
        )
        resolve(payment.id)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleReject() {
    setReasonError(null)
    startTransition(async () => {
      const result = await rejectPaymentAction(payment.id, reason)
      if (result.success) {
        toast.success('Paiement rejeté. Le joueur peut resoumettre une preuve.')
        setRejectOpen(false)
        setReason('')
        resolve(payment.id)
      } else {
        setReasonError(result.fieldErrors?.reason?.[0] ?? null)
        toast.error(result.error)
      }
    })
  }

  async function openProof() {
    if (!payment.hasProof) return
    setProofOpen(true)
    if (proofUrl) return
    setProofLoading(true)
    const result = await getProofUrlAction(payment.id)
    setProofLoading(false)
    if (result.success && result.data.url) {
      setProofUrl(result.data.url)
    } else {
      toast.error("Impossible de charger la preuve.")
      setProofOpen(false)
    }
  }

  return (
    <article className="rounded-xl border border-border bg-surface-1 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <PaymentMethodIcon method={payment.method} size="md" />
          <div className="min-w-0">
            <PlayerPseudo pseudo={payment.pseudo} size="sm" />
            <p className="text-xs text-text-secondary">
              {METHOD_LABELS[payment.method]} ·{' '}
              {dateFormatter.format(new Date(payment.submittedAt))}
            </p>
          </div>
        </div>
        <FCFA amount={payment.amountFcfa} large className="text-text-primary" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Field label="Téléphone joueur" value={payment.phone || '—'} />
        <Field
          label="Référence transaction"
          value={payment.transactionRef || '—'}
        />
        <Field label="Expéditeur (nom)" value={payment.senderName || '—'} />
        <Field
          label="Expéditeur (téléphone)"
          value={payment.senderPhone || '—'}
        />
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={openProof}
          disabled={!payment.hasProof}
        >
          <ExternalLink className="size-4" aria-hidden />
          {payment.hasProof ? 'Voir la preuve' : 'Aucune preuve'}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
            className="text-danger hover:text-danger"
          >
            <X className="size-4" aria-hidden />
            Rejeter
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            Confirmer
          </Button>
        </div>
      </div>

      {/* ─── Modale de rejet ─────────────────────────────────────────── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la preuve de paiement</DialogTitle>
            <DialogDescription>
              Indiquez un motif clair. La réservation reste valide : le joueur
              pourra resoumettre une preuve. Aucun remboursement n’est possible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`reject-reason-${payment.id}`}>Motif du rejet</Label>
            <textarea
              id={`reject-reason-${payment.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ex : le montant ne correspond pas, capture illisible…"
              className={cn(
                'w-full rounded-md border bg-surface-2 px-3 py-2 text-sm',
                'text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:ring-2 focus:ring-accent-violet',
                reasonError ? 'border-danger' : 'border-border',
              )}
            />
            {reasonError && <p className="text-xs text-danger">{reasonError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleReject}
              disabled={isPending}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Aperçu de la preuve ─────────────────────────────────────── */}
      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preuve de paiement</DialogTitle>
            <DialogDescription>
              Aperçu temporaire et privé (lien valable quelques minutes).
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-40 items-center justify-center">
            {proofLoading ? (
              <Loader2 className="size-6 animate-spin text-text-secondary" />
            ) : proofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proofUrl}
                alt="Preuve de paiement"
                className="max-h-[60vh] w-auto rounded-md"
              />
            ) : (
              <p className="text-sm text-text-secondary">
                Aperçu indisponible.
              </p>
            )}
          </div>

          {proofUrl && (
            <DialogFooter>
              <Button asChild variant="secondary">
                <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  Ouvrir en plein écran
                </a>
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </article>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-text-secondary">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-text-primary" title={value}>
        {value}
      </dd>
    </div>
  )
}