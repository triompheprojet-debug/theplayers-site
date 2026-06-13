'use client'

import { CircleUserRound } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { BracketMatchRealtime } from '@/lib/realtime/bracket-channel'

/**
 * Carte de match publique (M14). Lecture seule : pseudos + badges + scores.
 *
 * `highlightPseudo` (optionnel, utilisé par l'espace joueur) met en avant les
 * lignes du joueur courant. No-Line : séparation par tons de surface, accent
 * violet (fond) sur le vainqueur et sur le joueur mis en avant.
 */
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'À venir',
  in_progress: 'En cours',
  completed: 'Terminé',
  forfeit: 'Forfait',
  cancelled: 'Annulé',
}

export function MatchCard({
  match,
  highlightPseudo,
}: {
  match: BracketMatchRealtime
  highlightPseudo?: string | null
}) {
  const isResolved =
    match.status === 'completed' || match.status === 'forfeit'

  return (
    <article className="rounded-xl bg-surface-1 p-3">
      <header className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          {match.bracket_position ?? `Match ${match.match_number}`}
        </span>
        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-text-muted">
          {STATUS_LABELS[match.status] ?? match.status}
        </span>
      </header>

      <PlayerRow
        pseudo={match.player_a_pseudo}
        badge={match.player_a_badge}
        score={match.score_a}
        isWinner={match.winner_side === 'a'}
        dimmed={isResolved && match.winner_side === 'b'}
        highlighted={
          Boolean(highlightPseudo) &&
          match.player_a_pseudo === highlightPseudo
        }
      />
      <div className="my-1 h-px bg-surface-2" />
      <PlayerRow
        pseudo={match.player_b_pseudo}
        badge={match.player_b_badge}
        score={match.score_b}
        isWinner={match.winner_side === 'b'}
        dimmed={isResolved && match.winner_side === 'a'}
        highlighted={
          Boolean(highlightPseudo) &&
          match.player_b_pseudo === highlightPseudo
        }
      />
    </article>
  )
}

function PlayerRow({
  pseudo,
  badge,
  score,
  isWinner,
  dimmed,
  highlighted,
}: {
  pseudo: string | null
  badge: number | null
  score: number | null
  isWinner: boolean
  dimmed: boolean
  highlighted: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-1.5',
        (isWinner || highlighted) && 'bg-accent-violet/10',
      )}
    >
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
          highlighted
            ? 'font-bold text-accent-violet'
            : isWinner
              ? 'font-bold text-text-primary'
              : 'text-text-secondary',
          dimmed && !highlighted && 'text-text-muted',
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