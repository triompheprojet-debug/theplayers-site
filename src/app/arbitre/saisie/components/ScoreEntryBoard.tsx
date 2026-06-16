'use client'

import { ListChecks } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

import { ConsoleGrid } from './ConsoleGrid'
import { MatchScoreForm } from './MatchScoreForm'
import { MatchTimer } from './MatchTimer'

import type { AdminBracketMatch } from '@/lib/bracket/read'

interface ScoreEntryBoardProps {
  matches: AdminBracketMatch[]
  consoleCount: number | null
  matchDurationMinutes: number | null
}

/**
 * Orchestrateur de l'écran de saisie (mobile-first, single-thumb).
 *
 * - Grille des consoles (qui joue où) — si la config consoles est présente.
 * - Liste des matchs jouables, sélection au tap.
 * - Match sélectionné : timer + formulaire de score / forfait.
 *
 * La sélection est DÉRIVÉE (pas de setState dans un effet) : si le match
 * sélectionné disparaît après un rafraîchissement (score saisi), on retombe
 * sur le premier match restant.
 */
export function ScoreEntryBoard({
  matches,
  consoleCount,
  matchDurationMinutes,
}: ScoreEntryBoardProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Aucun match à saisir"
        description="Tous les matchs en cours ont été renseignés, ou aucun n'est encore programmé."
      />
    )
  }

  // Sélection dérivée : match choisi, sinon le premier de la liste.
  const selected =
    matches.find((m) => m.id === selectedId) ?? matches[0] ?? null

  return (
    <div className="flex flex-col gap-5">
      {consoleCount !== null ? (
        <ConsoleGrid
          matches={matches}
          consoleCount={consoleCount}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
        />
      ) : (
        <p className="rounded-lg bg-surface-1 px-4 py-3 text-sm text-text-secondary">
          Configuration des consoles absente : la grille n{"'"}est pas affichée.
        </p>
      )}

      {/* Sélecteur de match */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">
          Matchs à saisir ({matches.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {matches.map((m) => {
            const isActive = selected?.id === m.id
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left',
                    'transition-colors active:scale-[0.99]',
                    isActive
                      ? 'bg-referee/15 text-text-primary'
                      : 'bg-surface-1 text-text-secondary hover:text-text-primary',
                  )}
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary">
                      {m.playerAPseudo ?? 'Joueur A'}{' '}
                      <span className="text-text-muted">vs</span>{' '}
                      {m.playerBPseudo ?? 'Joueur B'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {matchLabel(m)}
                    </span>
                  </span>
                  <StatusDot status={m.status} />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Match sélectionné : timer + saisie. key = reset à chaque changement. */}
      {selected ? (
        <section className="flex flex-col gap-4">
          <MatchTimer
            key={`timer-${selected.id}`}
            durationMinutes={matchDurationMinutes}
          />
          <MatchScoreForm
            key={`form-${selected.id}`}
            match={selected}
            onSubmitted={() => {
              setSelectedId(null)
              router.refresh()
            }}
          />
        </section>
      ) : null}
    </div>
  )
}

function matchLabel(m: AdminBracketMatch): string {
  const parts: string[] = []
  if (m.consoleNumber !== null) parts.push(`Console ${m.consoleNumber}`)
  if (m.waveNumber !== null) parts.push(`Vague ${m.waveNumber}`)
  parts.push(`Tour ${m.roundNumber} · Match ${m.matchNumber}`)
  return parts.join(' · ')
}

function StatusDot({ status }: { status: AdminBracketMatch['status'] }) {
  const isLive = status === 'in_progress'
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
      <span
        aria-hidden="true"
        className={cn(
          'h-2 w-2 rounded-full',
          isLive ? 'bg-referee' : 'bg-text-muted',
        )}
      />
      <span className={isLive ? 'text-referee' : 'text-text-muted'}>
        {isLive ? 'En cours' : 'À venir'}
      </span>
    </span>
  )
}