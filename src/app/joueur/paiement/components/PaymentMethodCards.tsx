'use client'

import { Check, Copy } from 'lucide-react'

import { AirtelIcon } from '@/components/icons/AirtelIcon'
import { MTNIcon } from '@/components/icons/MTNIcon'
import { FCFA } from '@/components/shared/FCFA'
import { useClipboard } from '@/hooks/useClipboard'

interface PaymentMethodCardsProps {
  mtnNumber: string | null
  mtnHolder: string | null
  airtelNumber: string | null
  airtelHolder: string | null
  amountFcfa: number | null
}

/**
 * Cartes des deux moyens mobile money (Règle 3 : libellés exacts).
 * Numéros lus depuis la config du tournoi actif (Règle 11) et copiables.
 *
 * NOTE : MTNIcon / AirtelIcon sont importés avec la prop `className`. Si leur
 * signature réelle diffère (props), adapter l'import — leur contenu n'était pas
 * disponible au moment de la génération.
 */
export function PaymentMethodCards({
  mtnNumber,
  mtnHolder,
  airtelNumber,
  airtelHolder,
  amountFcfa,
}: PaymentMethodCardsProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-text-primary">
          Où envoyer le paiement
        </h2>
        {amountFcfa != null && (
          <p className="text-sm text-text-secondary">
            Montant à régler : <FCFA amount={amountFcfa} />
          </p>
        )}
      </div>

      <MethodCard
        label="MTN Mobile Money"
        icon={<MTNIcon className="h-8 w-8" />}
        number={mtnNumber}
        holder={mtnHolder}
      />
      <MethodCard
        label="Airtel Money"
        icon={<AirtelIcon className="h-8 w-8" />}
        number={airtelNumber}
        holder={airtelHolder}
      />

      <p className="text-xs text-text-secondary">
        Après le dépôt, remplis le formulaire ci-dessous avec la référence de
        transaction et la capture d&apos;écran.
      </p>
    </section>
  )
}

function MethodCard({
  label,
  icon,
  number,
  holder,
}: {
  label: string
  icon: React.ReactNode
  number: string | null
  holder: string | null
}) {
  const { copied, copy } = useClipboard()

  if (!number) {
    return (
      <div className="rounded-2xl bg-surface-1 p-4">
        <div className="flex items-center gap-3">
          <span className="shrink-0">{icon}</span>
          <div>
            <p className="font-semibold text-text-primary">{label}</p>
            <p className="text-sm text-text-secondary">
              Numéro non disponible pour le moment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-surface-1 p-4">
      <div className="flex items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary">{label}</p>
          <p className="font-mono text-lg text-text-primary">{number}</p>
          {holder && (
            <p className="truncate text-sm text-text-secondary">{holder}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => copy(number)}
          aria-label={`Copier le numéro ${label}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-secondary transition-transform active:scale-95"
        >
          {copied ? (
            <Check className="h-5 w-5 text-success-neon" aria-hidden="true" />
          ) : (
            <Copy className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}