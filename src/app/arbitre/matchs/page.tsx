import { CalendarClock, Trophy } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { getAdminBracket } from '@/lib/bracket/read'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { MatchListView } from './components/MatchListView'

/**
 * Liste des matchs du tournoi actif (arbitre) — lecture seule, filtrable
 * (tour, statut, console, vague). Vue d'ensemble pour s'orienter le jour J ;
 * la saisie se fait sur l'onglet « Saisie ».
 */
export default async function RefereeMatchesPage() {
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucun tournoi actif"
        description="Aucun match à afficher tant qu'un tournoi n'est pas défini comme actif."
      />
    )
  }

  const bracket = await getAdminBracket(tournament.id)
  if (!bracket || !bracket.hasBracket) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Bracket pas encore tiré"
        description="Le tableau des matchs n'a pas encore été généré par l'administrateur."
      />
    )
  }

  return <MatchListView matches={bracket.matches} />
}