import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PublicBracket } from '@/app/(public)/bracket/components/PublicBracket'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

/**
 * Bracket arbitre — lecture seule. Réutilise le composant public `PublicBracket`
 * (M14, temps réel via `public_bracket_view`) : zéro duplication. Le bracket
 * n'apparaît qu'une fois publié par l'administrateur.
 */
export default async function RefereeBracketPage() {
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucun tournoi actif"
        description="Aucun bracket à afficher tant qu'un tournoi n'est pas défini comme actif."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-tight text-text-primary">
          Bracket
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{tournament.name}</p>
      </header>

      <PublicBracket tournamentId={tournament.id} />
    </div>
  )
}