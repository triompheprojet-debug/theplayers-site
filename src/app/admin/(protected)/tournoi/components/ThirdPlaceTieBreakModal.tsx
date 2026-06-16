'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Medal } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import { resolveThirdPlaceAction } from '../actions'

import type { PendingTieBreak } from '@/lib/standings/tournament-standings'

interface ThirdPlaceTieBreakModalProps {
  tournamentId: string
  tieBreak: PendingTieBreak | null
  onClose: () => void
  onResolved: () => void
}

/**
 * Modale de départage 3ᵉ/4ᵉ (M16, Voie 2). N'apparaît qu'en cas d'égalité
 * stricte en demi-finale. Le formulaire est remonté via `key` à chaque nouvelle
 * paire (état réinitialisé sans useEffect).
 */
export function ThirdPlaceTieBreakModal({
  tournamentId,
  tieBreak,
  onClose,
  onResolved,
}: ThirdPlaceTieBreakModalProps) {
  return (
    <Dialog open={Boolean(tieBreak)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {tieBreak && (
          <TieBreakForm
            key={`${tieBreak.playerAId}-${tieBreak.playerBId}`}
            tournamentId={tournamentId}
            tieBreak={tieBreak}
            onClose={onClose}
            onResolved={onResolved}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function TieBreakForm({
  tournamentId,
  tieBreak,
  onClose,
  onResolved,
}: {
  tournamentId: string
  tieBreak: PendingTieBreak
  onClose: () => void
  onResolved: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string | null>(null)

  const options = [
    {
      id: tieBreak.playerAId,
      pseudo: tieBreak.playerAPseudo,
      badge: tieBreak.playerABadge,
      score: tieBreak.playerASemiScore,
    },
    {
      id: tieBreak.playerBId,
      pseudo: tieBreak.playerBPseudo,
      badge: tieBreak.playerBBadge,
      score: tieBreak.playerBSemiScore,
    },
  ]

  function handleConfirm() {
    if (!selected) return
    startTransition(async () => {
      const result = await resolveThirdPlaceAction(tournamentId, selected)
      if (result.success) {
        toast.success('Départage enregistré.')
        onResolved()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Départage 3ᵉ / 4ᵉ place</DialogTitle>
        <DialogDescription>
          {
            'Égalité stricte en demi-finale (même différence de buts, mêmes buts marqués). Choisissez le 3ᵉ ; l’autre sera 4ᵉ.'
          }
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const isSelected = selected === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              className={cn(
                'relative rounded-xl bg-surface-2 p-3.5 text-left transition-colors',
                isSelected
                  ? 'ring-2 ring-inset ring-accent-violet'
                  : 'hover:bg-surface-3',
              )}
            >
              {isSelected && (
                <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-success-neon text-background">
                  <Check className="size-3.5" aria-hidden />
                </span>
              )}
              <p className="text-xs uppercase tracking-wide text-text-muted">
                {o.badge != null ? `Badge ${o.badge}` : 'Badge —'}
              </p>
              <p className="mt-0.5 text-lg font-semibold text-text-primary">
                {o.pseudo ?? 'Joueur'}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Demi-finale ·{' '}
                <span className="text-text-primary">
                  {o.score.for} {'—'} {o.score.against}
                </span>
              </p>
              <p className="text-xs text-text-secondary">
                Diff. buts ·{' '}
                <span className="text-text-primary">
                  {o.score.for - o.score.against}
                </span>
              </p>
            </button>
          )
        })}
      </div>

      <DialogFooter>
        <Button variant="ghost" type="button" onClick={onClose}>
          Annuler
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={!selected || isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Medal className="size-4" aria-hidden />
          )}
          Confirmer la 3ᵉ place
        </Button>
      </DialogFooter>
    </>
  )
}