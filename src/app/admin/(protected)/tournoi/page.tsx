/**
 * Page admin — Gestion du tournoi / Bracket (M14) + clôture du classement (M16).
 *
 * Server Component : charge le tournoi actif (service_role) + l'état du bracket.
 * BracketManager pilote l'interactivité du bracket ; StandingsClosureCard (bloc
 * dédié, distinct du bracket) déclenche le calcul du classement final une fois
 * tous les matchs joués.
 */
import { Info } from 'lucide-react'

import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'
import { getAdminBracket } from '@/lib/bracket/read'

import { BracketManager } from './components/BracketManager'
import { StandingsClosureCard } from './components/StandingsClosureCard'

export const dynamic = 'force-dynamic'

export default async function AdminTournamentPage() {
  const tournament = await getActiveTournamentForAdmin()

  if (!tournament) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-text-primary">
          Gestion du tournoi
        </h1>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-surface-1 p-5">
          <Info className="size-5 shrink-0 text-text-secondary" aria-hidden />
          <p className="text-sm text-text-secondary">
            Aucun tournoi actif. Définissez un tournoi actif depuis la gestion
            des éditions avant de pouvoir générer un bracket.
          </p>
        </div>
      </div>
    )
  }

  const bracket = await getAdminBracket(tournament.id)

  const hasBracket = bracket !== null && bracket.hasBracket
  const isFinished =
    bracket !== null &&
    bracket.hasBracket &&
    bracket.matches.length > 0 &&
    bracket.matches.every(
      (m) =>
        !m.playerAId ||
        !m.playerBId ||
        m.status === 'cancelled' ||
        m.winnerSide !== null,
    )

  return (
    <div className="space-y-8">
      <BracketManager
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        initialBracket={bracket}
      />

      {hasBracket && (
        <StandingsClosureCard
          tournamentId={tournament.id}
          isFinished={isFinished}
        />
      )}
    </div>
  )
}