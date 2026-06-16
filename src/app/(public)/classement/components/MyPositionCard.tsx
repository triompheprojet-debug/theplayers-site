import { ArrowUp, BadgeCheck } from 'lucide-react'

import { RankBadge } from '@/components/shared/RankBadge'
import { RANK_TIERS, getRankFromPoints } from '@/config/ranks'
import { pointsToNextRank } from '@/lib/standings/rank-calculation'

import type { MyPosition } from '@/lib/standings/leaderboard'

/**
 * Carte « ma position » (joueur) : rang, pseudo, RankBadge, points, barre de
 * progression vers le rang suivant, et badge « Qualifié Grande Finale »
 * conditionnel. Composant purement présentationnel.
 */
export function MyPositionCard({
  pseudo,
  standing,
}: {
  pseudo: string
  standing: MyPosition
}) {
  const tier = getRankFromPoints(standing.totalPoints)
  const next = pointsToNextRank(standing.totalPoints)
  const nextLabel = next
    ? (RANK_TIERS.find((t) => t.key === next.nextRank)?.label ?? '')
    : null

  const fillPct =
    tier.maxPoints === null
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((standing.totalPoints - tier.minPoints) /
                (tier.maxPoints - tier.minPoints + 1)) *
                100,
            ),
          ),
        )

  return (
    <div className="rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Rang
          </p>
          <p className="text-4xl font-bold leading-none text-accent-violet">
            {standing.position}
            <span className="align-top text-base text-text-muted">e</span>
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-text-primary">
            {pseudo}
          </p>
          <RankBadge rank={standing.rank} withLabel size="sm" className="mt-1" />
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold leading-none text-success-neon">
            {standing.totalPoints.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-text-muted">points</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent-violet"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-text-secondary">
        <span>{tier.label}</span>
        {next ? (
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="size-3.5" aria-hidden />
            {next.pointsRemaining} pts avant {nextLabel}
          </span>
        ) : (
          <span>Rang maximal atteint</span>
        )}
      </div>

      {standing.qualified && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-success-neon/10 px-4 py-3">
          <BadgeCheck
            className="size-5 shrink-0 text-success-neon"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-success-neon">
              Qualifié pour la Grande Finale
            </p>
            <p className="text-xs text-text-secondary">
              Seuil de qualification atteint.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}