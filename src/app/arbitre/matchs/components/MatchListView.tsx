'use client'

import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'

import { MatchListCard } from './MatchListCard'
import {
  MatchListFilters,
  type FilterOptions,
  type MatchFilters,
} from './MatchListFilters'

import type { AdminBracketMatch } from '@/lib/bracket/read'

/**
 * Vue filtrable des matchs (arbitre). État des filtres côté client, liste
 * dérivée par `useMemo` — aucun appel réseau, tout vient du Server Component.
 */
export function MatchListView({ matches }: { matches: AdminBracketMatch[] }) {
  const [filters, setFilters] = useState<MatchFilters>({
    round: 'all',
    status: 'all',
    console: 'all',
    wave: 'all',
  })

  const options = useMemo(() => deriveOptions(matches), [matches])
  const filtered = useMemo(
    () => matches.filter((m) => matchesFilter(m, filters)),
    [matches, filters],
  )

  return (
    <div className="flex flex-col gap-4">
      <MatchListFilters
        options={options}
        filters={filters}
        onChange={setFilters}
      />

      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
        {filtered.length} match{filtered.length > 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun match"
          description="Aucun match ne correspond à ces filtres."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((m) => (
            <li key={m.id}>
              <MatchListCard match={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function matchesFilter(m: AdminBracketMatch, f: MatchFilters): boolean {
  if (f.round !== 'all' && m.roundNumber !== f.round) return false
  if (f.status !== 'all' && m.status !== f.status) return false
  if (f.console !== 'all' && m.consoleNumber !== f.console) return false
  if (f.wave !== 'all' && m.waveNumber !== f.wave) return false
  return true
}

function deriveOptions(matches: AdminBracketMatch[]): FilterOptions {
  const rounds = new Set<number>()
  const statuses = new Set<AdminBracketMatch['status']>()
  const consoles = new Set<number>()
  const waves = new Set<number>()

  for (const m of matches) {
    rounds.add(m.roundNumber)
    statuses.add(m.status)
    if (m.consoleNumber !== null) consoles.add(m.consoleNumber)
    if (m.waveNumber !== null) waves.add(m.waveNumber)
  }

  const asc = (a: number, b: number) => a - b
  return {
    rounds: Array.from(rounds).sort(asc),
    statuses: Array.from(statuses),
    consoles: Array.from(consoles).sort(asc),
    waves: Array.from(waves).sort(asc),
  }
}