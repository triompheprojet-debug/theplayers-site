'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CircleCheck,
  Clock,
  ListOrdered,
  Loader2,
  RefreshCw,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { computeTournamentStandingsAction } from '../actions'
import { ThirdPlaceTieBreakModal } from './ThirdPlaceTieBreakModal'

import type { PendingTieBreak } from '@/lib/standings/tournament-standings'

interface StandingsClosureCardProps {
  tournamentId: string
  isFinished: boolean
}

/**
 * Bloc dédié « Clôture & classement » (M16) — distinct du bloc bracket.
 * Calcule le classement final du tournoi actif. En cas d'égalité stricte en
 * demi (3ᵉ/4ᵉ indéterminés), ouvre la modale de départage.
 */
export function StandingsClosureCard({
  tournamentId,
  isFinished,
}: StandingsClosureCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tieBreak, setTieBreak] = useState<PendingTieBreak | null>(null)

  function handleCompute() {
    startTransition(async () => {
      const result = await computeTournamentStandingsAction(tournamentId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      if (result.data.finalized) {
        toast.success(
          `Classement figé (${result.data.standingsCount} joueurs).`,
        )
        router.refresh()
      } else {
        setTieBreak(result.data.pendingTieBreak)
      }
    })
  }

  return (
    <section className="rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-violet/15 text-accent-violet">
          <Trophy className="size-5" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Classement final
          </p>
          <h2 className="text-base font-semibold text-text-primary">
            Figer les résultats du tournoi
          </h2>
        </div>
        {isFinished ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-neon/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-success-neon">
            <CircleCheck className="size-3.5" aria-hidden />
            Tournoi terminé
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            <Clock className="size-3.5" aria-hidden />
            En cours
          </span>
        )}
      </div>

      <p className="mt-2.5 text-sm text-text-secondary">
        {isFinished
          ? 'Le calcul dérive les paliers, attribue les points, déduit les rangs et met à jour le classement public.'
          : 'Terminez tous les matchs (chaque match doit avoir un vainqueur) pour pouvoir calculer le classement.'}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={handleCompute} disabled={!isFinished || isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ListOrdered className="size-4" aria-hidden />
          )}
          Calculer le classement
        </Button>
        {isFinished && (
          <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
            <RefreshCw className="size-3.5" aria-hidden />
            Recalculable à tout moment.
          </span>
        )}
      </div>

      <ThirdPlaceTieBreakModal
        tournamentId={tournamentId}
        tieBreak={tieBreak}
        onClose={() => setTieBreak(null)}
        onResolved={() => {
          setTieBreak(null)
          router.refresh()
        }}
      />
    </section>
  )
}