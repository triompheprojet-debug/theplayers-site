'use client'

import { Loader2, Shuffle, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Confirmation du tirage au sort (M14).
 *
 * Le tirage est DÉFINITIF (il ne peut pas être relancé une fois effectué) :
 * on demande une confirmation explicite et on rappelle qui sera inclus
 * (joueurs confirmés avec badge). Aucune valeur en dur : le décompte vient de
 * l'état réel chargé côté serveur.
 */
interface DrawConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eligibleCount: number
  isPending: boolean
  onConfirm: () => void
}

export function DrawConfirmModal({
  open,
  onOpenChange,
  eligibleCount,
  isPending,
  onConfirm,
}: DrawConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lancer le tirage au sort</DialogTitle>
          <DialogDescription>
            Le tirage place aléatoirement les joueurs confirmés dans le bracket.
            Cette opération est définitive et ne peut pas être relancée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-surface-2 px-4 py-3 text-text-secondary">
            Seuls les joueurs au paiement confirmé (avec un numéro de badge)
            sont inclus. Les vagues, consoles et horaires sont calculés
            automatiquement depuis la configuration du tournoi.
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-surface-2 px-4 py-3 text-text-secondary">
            <TriangleAlert
              className="size-4 shrink-0 text-warning"
              aria-hidden
            />
            <span>
              {
                "Une fois le tirage lancé, le bracket reste en brouillon jusqu'à sa publication. Les joueurs ne sont notifiés qu'à la publication."
              }
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isPending || eligibleCount < 2}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Shuffle className="size-4" aria-hidden />
            )}
            Lancer le tirage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}