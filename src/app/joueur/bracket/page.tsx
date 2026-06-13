/**
 * Page joueur — « Mon Bracket » (M14).
 *
 * Server Component : lit le tournoi actif (RPC publique → id, nom, type) et
 * délègue l'affichage au composant client `PlayerBracketView`, qui identifie
 * le joueur courant et met ses matchs en avant.
 *
 * L'authentification joueur est assurée par le layout de l'espace joueur
 * (src/app/joueur/layout.tsx). Cette page n'ajoute pas de garde supplémentaire.
 */
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

import { PlayerBracketView } from './components/PlayerBracketView'

export const dynamic = 'force-dynamic'

export default async function PlayerBracketPage() {
  const tournament = await getActiveTournamentPublic()

  if (!tournament) {
    return (
      <div className="px-4 pb-24 pt-6">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-text-primary">
          Mon Bracket
        </h1>
        <div className="mt-6 rounded-2xl bg-surface-1 px-6 py-12 text-center">
          <p className="text-sm text-text-secondary">
            Aucun tournoi actif pour le moment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PlayerBracketView
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      isOffSeason={tournament.tournament_type === 'off_season'}
    />
  )
}