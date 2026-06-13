/**
 * Page admin — Gestion du tournoi / Bracket (M14).
 *
 * Server Component : charge le tournoi actif (service_role) + l'état du
 * bracket, et délègue l'interactivité au composant client BracketManager.
 *
 * Accès : admin ou super_admin (le layout protégé applique déjà requireAdmin ;
 * la page n'ajoute pas de garde de rôle supplémentaire car referee n'a pas
 * d'entrée de menu vers cette route — les actions, elles, sont protégées).
 */
import { Info } from 'lucide-react'

import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'
import { getAdminBracket } from '@/lib/bracket/read'

import { BracketManager } from './components/BracketManager'

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

  return (
    <BracketManager
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      initialBracket={bracket}
    />
  )
}
