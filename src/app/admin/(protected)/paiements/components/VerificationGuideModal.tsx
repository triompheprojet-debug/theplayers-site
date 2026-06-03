'use client'

import { HelpCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Modale d'aide à la vérification d'une preuve (M10) — contenu statique.
 *
 * Rappelle les contrôles à effectuer selon la méthode (Règle 3 : libellés
 * stricts) et affiche les coordonnées officielles du tournoi à comparer
 * (numéros MTN / Airtel issus de la config — visibles admin uniquement).
 */
interface VerificationGuideModalProps {
  mtnNumber?: string | null
  mtnHolder?: string | null
  airtelNumber?: string | null
  airtelHolder?: string | null
}

export function VerificationGuideModal({
  mtnNumber,
  mtnHolder,
  airtelNumber,
  airtelHolder,
}: VerificationGuideModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <HelpCircle className="size-4" aria-hidden />
          Guide de vérification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comment vérifier une preuve</DialogTitle>
          <DialogDescription>
            Comparez chaque preuve aux coordonnées officielles avant de
            confirmer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <Step
            n={1}
            title="MTN Mobile Money"
            lines={[
              'Vérifiez que le destinataire correspond au compte officiel.',
              mtnNumber ? `Numéro officiel : ${mtnNumber}` : null,
              mtnHolder ? `Titulaire : ${mtnHolder}` : null,
              'Contrôlez le montant et la référence de transaction.',
            ]}
          />
          <Step
            n={2}
            title="Airtel Money"
            lines={[
              'Vérifiez que le destinataire correspond au compte officiel.',
              airtelNumber ? `Numéro officiel : ${airtelNumber}` : null,
              airtelHolder ? `Titulaire : ${airtelHolder}` : null,
              'Contrôlez le montant et la référence de transaction.',
            ]}
          />
          <Step
            n={3}
            title="Espèces"
            lines={[
              'Encaissement géré en présentiel via l’inscription manuelle.',
              'Aucune preuve en ligne attendue pour ce mode.',
            ]}
          />

          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-text-secondary">
            En cas de doute, rejetez avec un motif clair : le joueur pourra
            resoumettre une preuve. Aucun remboursement n’est possible.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Step({
  n,
  title,
  lines,
}: {
  n: number
  title: string
  lines: (string | null)[]
}) {
  return (
    <div className="space-y-1">
      <p className="font-semibold text-text-primary">
        {n}. {title}
      </p>
      <ul className="ml-4 list-disc space-y-0.5 text-text-secondary">
        {lines
          .filter((l): l is string => Boolean(l))
          .map((line) => (
            <li key={line}>{line}</li>
          ))}
      </ul>
    </div>
  )
}