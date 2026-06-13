/**
 * Page publique — Bracket du tournoi actif (M14).
 *
 * Server Component : lit le tournoi actif via la RPC publique (sans capacity
 * ni payment). Le rendu du bracket est délégué au composant client
 * `PublicBracket` (temps réel). Si aucun tournoi actif, message neutre.
 *
 * La visibilité réelle du bracket est gérée plus bas : `public_bracket_view`
 * ne renvoie rien tant que `bracket_visibility != 'published'`.
 */
import type { Metadata } from 'next'

import { getActiveTournamentPublic } from '@/lib/tournaments/active'

import { PublicBracket } from './components/PublicBracket'

export const metadata: Metadata = {
  title: 'Bracket',
  description: 'Suivez le bracket du tournoi en direct.',
}

export default async function PublicBracketPage() {
  const tournament = await getActiveTournamentPublic()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary">
          Bracket
        </h1>
        {tournament && (
          <p className="mt-1 text-sm text-text-secondary">{tournament.name}</p>
        )}
      </header>

      {tournament ? (
        <PublicBracket tournamentId={tournament.id} />
      ) : (
        <div className="rounded-2xl bg-surface-1 px-6 py-16 text-center">
          <p className="text-sm text-text-secondary">
            Aucun tournoi actif pour le moment.
          </p>
        </div>
      )}
    </div>
  )
}