import { cn } from '@/lib/utils'

import type { AdminBracketMatch } from '@/lib/bracket/read'
import type { Database } from '@/types/database.types'

type MatchStatus = Database['public']['Enums']['match_status']

const STATUS_META: Record<
  MatchStatus,
  { label: string; cls: string; live: boolean }
> = {
  scheduled: { label: 'À venir', cls: 'text-text-muted', live: false },
  in_progress: { label: 'En cours', cls: 'text-referee', live: true },
  completed: { label: 'Terminé', cls: 'text-success-neon', live: false },
  forfeit: { label: 'Forfait', cls: 'text-warning', live: false },
  cancelled: { label: 'Annulé', cls: 'text-danger', live: false },
}

/**
 * Carte d'un match (arbitre) — lecture seule. Affiche les pseudos, badges,
 * scores (si joué) et le statut. Le vainqueur est mis en avant en orange.
 */
export function MatchListCard({ match }: { match: AdminBracketMatch }) {
  const meta = STATUS_META[match.status]
  const showScores = match.status === 'completed' || match.status === 'forfeit'

  return (
    <article className="flex flex-col gap-2 rounded-lg bg-surface-1 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Tour {match.roundNumber} · Match {match.matchNumber}
          {match.consoleNumber !== null ? ` · Console ${match.consoleNumber}` : ''}
          {match.waveNumber !== null ? ` · Vague ${match.waveNumber}` : ''}
        </span>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide',
            meta.cls,
          )}
        >
          {meta.live ? (
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse rounded-full bg-referee"
            />
          ) : null}
          {meta.label}
        </span>
      </div>

      <PlayerRow
        pseudo={match.playerAPseudo ?? 'Joueur A'}
        badge={match.playerABadge}
        score={showScores ? match.scoreA : null}
        winner={match.winnerSide === 'a'}
      />
      <PlayerRow
        pseudo={match.playerBPseudo ?? 'Joueur B'}
        badge={match.playerBBadge}
        score={showScores ? match.scoreB : null}
        winner={match.winnerSide === 'b'}
      />
    </article>
  )
}

function PlayerRow({
  pseudo,
  badge,
  score,
  winner,
}: {
  pseudo: string
  badge: number | null
  score: number | null
  winner: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-md px-2 py-1',
        winner ? 'bg-referee/10' : '',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'truncate text-sm',
            winner
              ? 'font-bold text-text-primary'
              : 'font-medium text-text-secondary',
          )}
        >
          {pseudo}
        </span>
        {badge !== null ? (
          <span className="shrink-0 text-[11px] text-text-muted">#{badge}</span>
        ) : null}
      </span>

      <span
        className={cn(
          'shrink-0 font-mono text-lg tabular-nums',
          winner ? 'font-bold text-referee' : 'text-text-secondary',
        )}
      >
        {score !== null ? score : '–'}
      </span>
    </div>
  )
}