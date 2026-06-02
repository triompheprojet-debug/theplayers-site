'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '@/lib/payments/methods'
import { useRouter } from 'next/navigation'

import { submitPaymentProof } from '../actions'

const METHODS: PaymentMethod[] = ['mtn_mobile_money', 'airtel_money', 'cash']

interface PaymentProofFormProps {
  registrationId: string
  defaultAmount: number | null
}

/**
 * Formulaire de soumission de preuve de paiement.
 *
 * Construit un `FormData` (fichier inclus) transmis à la Server Action.
 * `cash` masque et neutralise le champ référence (Règle 3 + contrainte DB).
 * Erreurs par champ affichées sous l'input concerné.
 */
export function PaymentProofForm({
  registrationId,
  defaultAmount,
}: PaymentProofFormProps) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>('mtn_mobile_money')
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isCash = method === 'cash'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    formData.set('registrationId', registrationId)
    formData.set('method', method)
    if (isCash) formData.delete('transactionRef')

    const result = await submitPaymentProof(formData)
    setIsPending(false)

    if (!result.success) {
      if (result.fieldErrors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(result.fieldErrors)) {
          if (v[0]) flat[k] = v[0]
        }
        setErrors(flat)
      }
      toast.error(result.error)
      return
    }

    toast.success('Preuve envoyée. Vérification en cours.')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-semibold text-text-primary">
        Soumettre ma preuve
      </h2>

      {/* Méthode */}
      <div className="space-y-2">
        <Label>Méthode de paiement</Label>
        <div className="grid grid-cols-1 gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              aria-pressed={method === m}
              className={[
                'min-h-12 rounded-xl px-4 text-left text-sm font-medium transition-colors',
                method === m
                  ? 'bg-accent-violet text-white'
                  : 'bg-surface-2 text-text-secondary',
              ].join(' ')}
            >
              {PAYMENT_METHOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="amountFcfa">Montant (FCFA)</Label>
        <Input
          id="amountFcfa"
          name="amountFcfa"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={defaultAmount ?? undefined}
          className="h-12"
          required
        />
        {errors.amountFcfa && (
          <p className="text-sm text-danger">{errors.amountFcfa}</p>
        )}
      </div>

      {/* Référence — masquée pour cash */}
      {!isCash && (
        <div className="space-y-2">
          <Label htmlFor="transactionRef">Référence de transaction</Label>
          <Input
            id="transactionRef"
            name="transactionRef"
            type="text"
            className="h-12"
            placeholder="Ex : MP240601.1234.A56789"
          />
          {errors.transactionRef && (
            <p className="text-sm text-danger">{errors.transactionRef}</p>
          )}
        </div>
      )}

      {/* Numéro émetteur */}
      <div className="space-y-2">
        <Label htmlFor="senderPhone">
          Numéro émetteur <span className="text-text-muted">(facultatif)</span>
        </Label>
        <Input
          id="senderPhone"
          name="senderPhone"
          type="tel"
          inputMode="tel"
          className="h-12"
          placeholder="+242 06 XX XX XX XX"
        />
        {errors.senderPhone && (
          <p className="text-sm text-danger">{errors.senderPhone}</p>
        )}
      </div>

      {/* Créneau */}
      <div className="space-y-2">
        <Label htmlFor="timeSlot">
          Heure du dépôt <span className="text-text-muted">(facultatif)</span>
        </Label>
        <Input
          id="timeSlot"
          name="timeSlot"
          type="text"
          className="h-12"
          placeholder="Ex : vers 14h30"
        />
      </div>

      {/* Capture */}
      <div className="space-y-2">
        <Label htmlFor="proof">
          Capture d&apos;écran
          {!isCash && <span className="text-danger"> *</span>}
        </Label>
        <input
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-text-primary"
        />
        {errors.proof && <p className="text-sm text-danger">{errors.proof}</p>}
        <p className="text-xs text-text-secondary">
          JPEG, PNG ou WebP — 5 Mo maximum.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="min-h-13 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
      >
        {isPending ? 'Envoi…' : 'Envoyer ma preuve'}
      </Button>
    </form>
  )
}