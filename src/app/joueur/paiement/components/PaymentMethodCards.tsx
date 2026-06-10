'use client'

import { AlertTriangle, Check, Copy } from 'lucide-react'
import Image from 'next/image'

import { FCFA } from '@/components/shared/FCFA'
import { useClipboard } from '@/hooks/useClipboard'
import { formatPhoneLocal } from '@/lib/format/phone'

interface PaymentMethodCardsProps {
  mtnNumber: string | null
  mtnHolder: string | null
  airtelNumber: string | null
  airtelHolder: string | null
  amountFcfa: number | null
}

/**
 * Montant requis + comptes de réception (Règle 3 : libellés exacts).
 * Numéros lus depuis la config du tournoi actif (Règle 11), copiables.
 *
 * Affichage en format LOCAL congolais ("06 123 45 67") et copie des chiffres
 * locaux sans espaces ("061234567") — le format le plus pratique pour saisir
 * le bénéficiaire dans MTN MoMo / Airtel Money.
 *
 * Logos opérateurs = images PNG dans /public/images/operateur_telephonique.
 */
export function PaymentMethodCards({
  mtnNumber,
  mtnHolder,
  airtelNumber,
  airtelHolder,
  amountFcfa,
}: PaymentMethodCardsProps) {
  return (
    <div className="space-y-4">
      {amountFcfa != null ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-1 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Montant requis
          </p>
          <FCFA amount={amountFcfa} large className="text-3xl text-accent-violet" />
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-warning">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Envoie le montant exact
          </p>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Comptes de réception
        </h2>

        <MethodCard
          label="MTN Mobile Money"
          logoSrc="/images/operateur_telephonique/logo-mtn.png"
          number={mtnNumber}
          holder={mtnHolder}
        />
        <MethodCard
          label="Airtel Money"
          logoSrc="/images/operateur_telephonique/logo-airtel.png"
          number={airtelNumber}
          holder={airtelHolder}
        />

        <p className="text-xs text-text-secondary">
          {"Après le dépôt, remplis le formulaire ci-dessous avec la référence et la capture d'écran."}
        </p>
      </section>
    </div>
  )
}

function MethodCard({
  label,
  logoSrc,
  number,
  holder,
}: {
  label: string
  logoSrc: string
  number: string | null
  holder: string | null
}) {
  const { copied, copy } = useClipboard()

  // Affichage local lisible ; copie = chiffres locaux sans espaces.
  const display = number ? formatPhoneLocal(number) : null
  const copyValue = display ? display.replace(/\s/g, '') : ''

  return (
    <div className="rounded-2xl bg-surface-1 p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-7 w-14 shrink-0">
          <Image
            src={logoSrc}
            alt={label}
            fill
            sizes="56px"
            className="object-contain object-left"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {label}
          </p>
          {display ? (
            <p className="font-mono text-base text-text-primary">{display}</p>
          ) : (
            <p className="text-sm text-text-secondary">Numéro non disponible.</p>
          )}
          {display && holder ? (
            <p className="truncate text-xs text-text-secondary">{holder}</p>
          ) : null}
        </div>

        {display ? (
          <button
            type="button"
            onClick={() => copy(copyValue)}
            aria-label={`Copier le numéro ${label}`}
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-accent-violet transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success-neon" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="text-xs font-bold uppercase tracking-wide">
              {copied ? 'Copié' : 'Copier'}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}