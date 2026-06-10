'use client'

import { Banknote, Clock, Hash, Phone, Send, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '@/lib/payments/methods'
import { cn } from '@/lib/utils'

import { submitPaymentProof } from '../actions'

const METHODS: PaymentMethod[] = ['mtn_mobile_money', 'airtel_money', 'cash']

const LABEL_CLS = 'text-xs font-bold uppercase tracking-wider text-text-secondary'
const INPUT_CLS =
  'h-12 border-0 bg-surface-2 dark:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-violet'

interface PaymentProofFormProps {
  registrationId: string
  defaultAmount: number | null
}

/**
 * Formulaire de soumission de preuve de paiement.
 *
 * Construit un `FormData` (fichier inclus) transmis à la Server Action.
 * `cash` (Espèces) masque le champ référence (Règle 3 + contrainte DB).
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

      {/* Méthode (3 méthodes — sélecteur empilé) */}
      <div className="space-y-2">
        <Label className={LABEL_CLS}>Méthode de paiement</Label>
        <div className="grid grid-cols-1 gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              aria-pressed={method === m}
              className={cn(
                'min-h-12 rounded-xl px-4 text-left text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
                method === m
                  ? 'bg-accent-violet text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary',
              )}
            >
              {PAYMENT_METHOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Référence — masquée pour Espèces */}
      {!isCash ? (
        <div className="space-y-2">
          <Label htmlFor="transactionRef" className={LABEL_CLS}>
            Référence de transaction
          </Label>
          <div className="relative">
            <Hash
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <Input
              id="transactionRef"
              name="transactionRef"
              type="text"
              className={cn(INPUT_CLS, 'pl-11')}
              placeholder="Ex : MP240601.1234.A56789"
            />
          </div>
          {errors.transactionRef ? (
            <p className="text-sm text-danger">{errors.transactionRef}</p>
          ) : null}
        </div>
      ) : null}

      {/* Numéro émetteur */}
      <div className="space-y-2">
        <Label htmlFor="senderPhone" className={LABEL_CLS}>
          Numéro émetteur <span className="text-text-muted">(facultatif)</span>
        </Label>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
          <Input
            id="senderPhone"
            name="senderPhone"
            type="tel"
            inputMode="tel"
            className={cn(INPUT_CLS, 'pl-11')}
            placeholder="+242 06 XX XX XX XX"
          />
        </div>
        {errors.senderPhone ? (
          <p className="text-sm text-danger">{errors.senderPhone}</p>
        ) : null}
      </div>

      {/* Nom du titulaire */}
      <div className="space-y-2">
        <Label htmlFor="senderName" className={LABEL_CLS}>
          Nom du titulaire <span className="text-text-muted">(facultatif)</span>
        </Label>
        <div className="relative">
          <User
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
          <Input
            id="senderName"
            name="senderName"
            type="text"
            className={cn(INPUT_CLS, 'pl-11')}
            placeholder="Ex : Jean Dupont"
          />
        </div>
      </div>

      {/* Heure du dépôt */}
      <div className="space-y-2">
        <Label htmlFor="timeSlot" className={LABEL_CLS}>
          Heure du dépôt <span className="text-text-muted">(facultatif)</span>
        </Label>
        <div className="relative">
          <Clock
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
          <Input
            id="timeSlot"
            name="timeSlot"
            type="text"
            className={cn(INPUT_CLS, 'pl-11')}
            placeholder="Ex : vers 14h30"
          />
        </div>
      </div>

      {/* Montant — verrouillé sur la config si disponible */}
      <div className="space-y-2">
        <Label htmlFor="amountFcfa" className={LABEL_CLS}>
          Montant envoyé (FCFA)
        </Label>
        <div className="relative">
          <Banknote
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
          <Input
            id="amountFcfa"
            name="amountFcfa"
            type="number"
            inputMode="numeric"
            min={1}
            required
            readOnly={defaultAmount != null}
            defaultValue={defaultAmount ?? undefined}
            className={cn(
              INPUT_CLS,
              'pl-11',
              defaultAmount != null && 'cursor-not-allowed opacity-70',
            )}
          />
        </div>
        {errors.amountFcfa ? (
          <p className="text-sm text-danger">{errors.amountFcfa}</p>
        ) : null}
      </div>

      {/* Capture (obligatoire hors Espèces — requise par la logique) */}
      <div className="space-y-2">
        <Label htmlFor="proof" className={LABEL_CLS}>
          Capture d&apos;écran
          {!isCash ? <span className="text-danger"> *</span> : null}
        </Label>
        <input
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-text-primary"
        />
        {errors.proof ? <p className="text-sm text-danger">{errors.proof}</p> : null}
        <p className="text-xs text-text-secondary">
          JPEG, PNG ou WebP — 5 Mo maximum.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {isPending ? 'Envoi…' : 'Envoyer ma preuve'}
      </Button>
    </form>
  )
}