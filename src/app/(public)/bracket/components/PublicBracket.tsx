'use client'

import { Trophy } from 'lucide-react'

import { useRealtimeBracket } from '@/hooks/useRealtimeBracket'

import { LiveStatusBadge } from './LiveStatusBadge'
import { MatchCard } from './MatchCard'

import type { BracketMatchRealtime } from '@/lib/realtime/bracket-channel'

/**
 * Bracket public en temps réel (M14).
 *
 * Lit `public_bracket_view` via `useRealtimeBracket` (pseudos + badges, visible
 * seulement si le bracket est publié → 0 ligne sinon). Rendu mobile-first :
 * colonnes par round en défilement horizontal, en-têtes de round collants.
 *
 * `highlightPseudo` permet à l'espace joueur de réutiliser ce composant en
 * mettant en avant le joueur courant.
 */
function roundTitle(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber
  if (fromEnd === 0) return 'Finale'
  if (fromEnd === 1) return 'Demi-finales'
  if (fromEnd === 2) return 'Quarts'
  if (fromEnd === 3) return 'Huitièmes'
  if (fromEnd === 4) return 'Seizièmes'
  return `Tour ${roundNumber}`
}

export function PublicBracket({
  tournamentId,
  highlightPseudo,
}: {
  tournamentId: string
  highlightPseudo?: string | null
}) {
  const { matches, isLoading } = useRealtimeBracket(tournamentId)

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface-1 px-6 py-16 text-center">
        <p className="text-sm text-text-secondary">Chargement du bracket…</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-1 px-6 py-16 text-center">
        <Trophy className="mx-auto size-8 text-text-muted" aria-hidden />
        <p className="mt-3 text-sm text-text-secondary">
          Le bracket n&apos est pas encore disponible. Revenez après le tirage au
          sort.
        </p>
      </div>
    )
  }

  // Regroupement par round
  const byRound = new Map<number, BracketMatchRealtime[]>()
  let maxRound = 0
  for (const m of matches) {
    if (m.round_number > maxRound) maxRound = m.round_number
    const list = byRound.get(m.round_number) ?? []
    list.push(m)
    byRound.set(m.round_number, list)
  }
  const roundNumbers = Array.from(byRound.keys()).sort((a, b) => a - b)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
          Arbre du tournoi
        </h2>
        <LiveStatusBadge matches={matches} />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex min-w-max gap-4">
          {roundNumbers.map((rn) => {
            const roundMatches = (byRound.get(rn) ?? []).sort(
              (a, b) => a.match_number - b.match_number,
            )
            return (
              <section
                key={rn}
                className="flex w-60 shrink-0 flex-col gap-3"
                aria-label={roundTitle(rn, maxRound)}
              >
                <h3 className="sticky top-0 z-10 flex items-center gap-1.5 bg-background/90 py-1 text-[11px] font-bold uppercase tracking-widest text-text-secondary backdrop-blur-sm">
                  {rn === maxRound && (
                    <Trophy className="size-3.5 text-accent-violet" aria-hidden />
                  )}
                  {roundTitle(rn, maxRound)}
                </h3>
                {roundMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    highlightPseudo={highlightPseudo}
                  />
                ))}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}