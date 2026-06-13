'use client'

import { cn } from '@/lib/utils'

import type { BracketMatchRealtime } from '@/lib/realtime/bracket-channel'

/**
 * Indicateur d'état global du bracket (M14, public).
 *
 * - « EN DIRECT » (point pulsé) si au moins un match est en cours.
 * - « TERMINÉ » si tous les matchs joués sont résolus et plus rien en attente.
 * - « À VENIR » sinon.
 *
 * Aucune donnée sensible : se base uniquement sur les statuts de matchs.
 */
export function LiveStatusBadge({
  matches,
}: {
  matches: BracketMatchRealtime[]
}) {
  if (matches.length === 0) return null

  const anyLive = matches.some((m) => m.status === 'in_progress')
  const allResolved = matches.every(
    (m) =>
      m.status === 'completed' ||
      m.status === 'forfeit' ||
      m.status === 'cancelled',
  )

  const state: 'live' | 'done' | 'upcoming' = anyLive
    ? 'live'
    : allResolved
      ? 'done'
      : 'upcoming'

  const config = {
    live: { label: 'En direct', dot: 'bg-success-neon', text: 'text-success-neon' },
    done: { label: 'Terminé', dot: 'bg-text-muted', text: 'text-text-secondary' },
    upcoming: {
      label: 'À venir',
      dot: 'bg-accent-violet',
      text: 'text-text-secondary',
    },
  }[state]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider',
        config.text,
      )}
    >
      <span className="relative flex size-2">
        {state === 'live' && (
          <span
            className={cn(
              'absolute inline-flex size-full animate-ping rounded-full opacity-75',
              config.dot,
            )}
          />
        )}
        <span
          className={cn('relative inline-flex size-2 rounded-full', config.dot)}
        />
      </span>
      {config.label}
    </span>
  )
}