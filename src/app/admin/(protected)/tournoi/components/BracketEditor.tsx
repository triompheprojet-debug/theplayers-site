'use client'

import { CircleUserRound, Pencil, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { AdminBracketMatch } from '@/lib/bracket/read'

/**
 * Éditeur de bracket (M14) — rendu en colonnes par round (élimination directe,
 * une seule finale, pas de petite finale). Chaque carte affiche les deux
 * joueurs (pseudo + badge), le score, le statut, et un bouton « Saisir score »
 * quand les deux joueurs sont déterminés et le match non terminé.
 *
 * No-Line : séparation par tons de surface, accent latéral coloré pour le
 * vainqueur (fond, pas bordure décorative). Pas d'avatar : CircleUserRound.
 */

interface BracketEditorProps {
  matches: AdminBracketMatch[]
  rounds: number
  onEnterScore: (match: AdminBracketMatch) => void
}

const STATUS_LABELS: Record<AdminBracketMatch['status'], string> = {
  scheduled: 'À venir',
  in_progress: 'En cours',
  completed: 'Terminé',
  forfeit: 'Forfait',
  cancelled: 'Annulé',
}

function roundTitle(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber
  if (fromEnd === 0) return 'Finale'
  if (fromEnd === 1) return 'Demi-finales'
  if (fromEnd === 2) return 'Quarts de finale'
  if (fromEnd === 3) return 'Huitièmes'
  if (fromEnd === 4) return 'Seizièmes'
  return `Tour ${roundNumber}`
}

export function BracketEditor({
  matches,
  rounds,
  onEnterScore,
}: BracketEditorProps) {
  // Regrouper par round
  const byRound = new Map<number, AdminBracketMatch[]>()
  for (const m of matches) {
    const list = byRound.get(m.roundNumber) ?? []
    list.push(m)
    byRound.set(m.roundNumber, list)
  }

  const roundNumbers = Array.from(byRound.keys()).sort((a, b) => a - b)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-6">
        {roundNumbers.map((rn) => {
          const roundMatches = (byRound.get(rn) ?? []).sort(
            (a, b) => a.matchNumber - b.matchNumber,
          )
          return (
            <section
              key={rn}
              className="flex w-72 shrink-0 flex-col gap-4"
              aria-label={roundTitle(rn, rounds)}
            >
              <h2 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-widest text-text-secondary">
                {rn === rounds && (
                  <Trophy className="size-4 text-accent-violet" aria-hidden />
                )}
                {roundTitle(rn, rounds)}
              </h2>

              {roundMatches.map((m) => (
                <MatchCard key={m.id} match={m} onEnterScore={onEnterScore} />
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function MatchCard({
  match,
  onEnterScore,
}: {
  match: AdminBracketMatch
  onEnterScore: (m: AdminBracketMatch) => void
}) {
  const bothPlayers = Boolean(match.playerAId && match.playerBId)
  const isResolved = match.status === 'completed' || match.status === 'forfeit'
  const canScore = bothPlayers && !isResolved && match.status !== 'cancelled'

  const title =
    match.bracketPosition ?? `Match ${match.matchNumber}`

  return (
    <article className="rounded-2xl bg-surface-1 p-4">
      <header className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {title}
        </span>
        {canScore ? (
          <button
            type="button"
            onClick={() => onEnterScore(match)}
            className="rounded-md bg-surface-2 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-violet transition-colors hover:bg-accent-violet/15"
          >
            <Pencil className="mr-1 inline size-3" aria-hidden />
            Saisir score
          </button>
        ) : (
          <span className="rounded-md bg-surface-2 px-2 py-1 text-xs text-text-muted">
            {STATUS_LABELS[match.status]}
          </span>
        )}
      </header>

      <PlayerRow
        pseudo={match.playerAPseudo}
        badge={match.playerABadge}
        score={match.scoreA}
        isWinner={match.winnerSide === 'a'}
        dimmed={isResolved && match.winnerSide === 'b'}
      />
      <div className="my-1.5 h-px bg-surface-2" />
      <PlayerRow
        pseudo={match.playerBPseudo}
        badge={match.playerBBadge}
        score={match.scoreB}
        isWinner={match.winnerSide === 'b'}
        dimmed={isResolved && match.winnerSide === 'a'}
      />

      {(match.consoleNumber != null || match.waveNumber != null) && (
        <footer className="mt-3 flex items-center gap-3 text-xs text-text-muted">
          {match.waveNumber != null && <span>Vague {match.waveNumber}</span>}
          {match.consoleNumber != null && (
            <span>Console {match.consoleNumber}</span>
          )}
        </footer>
      )}
    </article>
  )
}

function PlayerRow({
  pseudo,
  badge,
  score,
  isWinner,
  dimmed,
}: {
  pseudo: string | null
  badge: number | null
  score: number | null
  isWinner: boolean
  dimmed: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2 py-1.5',
        isWinner && 'bg-accent-violet/10',
      )}
    >
      <span
        className={cn(
          'h-6 w-1 shrink-0 rounded-full',
          isWinner ? 'bg-accent-violet' : 'bg-transparent',
        )}
        aria-hidden
      />
      <CircleUserRound
        className={cn(
          'size-4 shrink-0',
          dimmed ? 'text-text-muted' : 'text-text-secondary',
        )}
        aria-hidden
      />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          isWinner ? 'font-bold text-text-primary' : 'text-text-secondary',
          dimmed && 'text-text-muted',
        )}
      >
        {pseudo ?? <span className="italic text-text-muted">À déterminer</span>}
        {badge != null && (
          <span className="ml-1.5 text-xs text-text-muted">#{badge}</span>
        )}
      </span>
      <span
        className={cn(
          'shrink-0 text-sm tabular-nums',
          isWinner ? 'font-bold text-text-primary' : 'text-text-muted',
        )}
      >
        {score ?? '–'}
      </span>
    </div>
  )
}