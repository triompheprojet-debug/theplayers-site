'use client'

/**
 * Sélecteur du tournoi actif (M03.C) — refonte présentationnelle.
 * Trigger restylé (icône chevrons), tokens projet, logique inchangée.
 */
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { setActiveTournamentAction } from '@/lib/tournaments/active-actions'
import type { SelectableTournament } from '@/lib/tournaments/list-selectable'
import { cn } from '@/lib/utils'

interface ActiveTournamentSwitcherProps {
  currentActiveId: string | null
  tournaments: SelectableTournament[]
}

export function ActiveTournamentSwitcher({
  currentActiveId,
  tournaments,
}: ActiveTournamentSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(currentActiveId)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await setActiveTournamentAction(selectedId)

      if (result.success) {
        toast.success(
          selectedId ? 'Tournoi actif mis à jour.' : 'Tournoi actif effacé.',
        )
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (next) setSelectedId(currentActiveId)
    setOpen(next)
  }

  const hasChange = selectedId !== currentActiveId
  const noTournaments = tournaments.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={noTournaments}
          className="gap-1.5"
          title={
            noTournaments
              ? 'Aucun tournoi créé. Créez un tournoi dans Éditions.'
              : 'Changer le tournoi actif'
          }
        >
          <ChevronsUpDown className="size-3.5" aria-hidden />
          Changer
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le tournoi actif</DialogTitle>
          <DialogDescription>
            Le tournoi sélectionné sera mis en vedette publiquement et utilisé
            par défaut dans toutes les actions admin.
          </DialogDescription>
        </DialogHeader>

        {/* ─── Liste sélectionnable ─────────────────────────────────── */}
        <div className="max-h-100 overflow-y-auto -mx-6 px-6">
          <ul className="space-y-1">
            {/* Option "Aucun" */}
            <li>
              <SwitcherOption
                isSelected={selectedId === null}
                onClick={() => setSelectedId(null)}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center size-8 rounded-full bg-surface-2">
                    <X className="size-4 text-text-secondary" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      Aucun tournoi actif
                    </p>
                    <p className="text-xs text-text-secondary">
                      Le site public {"n'affichera"} pas de tournoi en vedette.
                    </p>
                  </div>
                </div>
              </SwitcherOption>
            </li>

            {/* Liste des tournois */}
            {tournaments.map((t) => (
              <li key={t.id}>
                <SwitcherOption
                  isSelected={selectedId === t.id}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TournamentTypeBadge type={t.tournament_type} />
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold text-text-primary truncate"
                        title={t.name}
                      >
                        {t.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatDateRange(t.start_date, t.end_date)}
                      </p>
                    </div>
                  </div>
                </SwitcherOption>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !hasChange}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                <span className="ml-2">Application…</span>
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================================================
// Sous-composant : option sélectionnable
// ===========================================================================
interface SwitcherOptionProps {
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
}

function SwitcherOption({ isSelected, onClick, children }: SwitcherOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        'w-full px-3 py-2.5 rounded-md text-left transition-colors',
        'flex items-center justify-between gap-2',
        isSelected
          ? 'bg-accent-violet/15 ring-1 ring-accent-violet/40'
          : 'hover:bg-surface-2',
      )}
    >
      {children}
      {isSelected && (
        <Check
          className="size-4 shrink-0 text-accent-violet"
          aria-label="Sélectionné"
        />
      )}
    </button>
  )
}

// ===========================================================================
// Format de dates "DD MMM YYYY → DD MMM YYYY"
// ===========================================================================
function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`
}