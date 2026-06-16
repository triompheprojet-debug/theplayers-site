'use client'

import { Flag, Loader2, Minus, Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { submitMatchScoreAction } from '../actions'

import type { AdminBracketMatch } from '@/lib/bracket/read'

interface MatchScoreFormProps {
  match: AdminBracketMatch
  onSubmitted: () => void
}

type Mode = 'score' | 'forfeit'

const SCORE_MIN = 0
const SCORE_MAX = 99

/**
 * Saisie du résultat d'un match (mobile-first, single-thumb).
 *
 * - Mode « Score » : deux pavés numériques (− / valeur / +). Égalité interdite
 *   (élimination directe) — le bouton de validation reste désactivé tant que
 *   les scores sont égaux.
 * - Mode « Forfait » : on désigne le joueur déclarant forfait (l'autre gagne),
 *   motif facultatif.
 *
 * La validation fait foi côté serveur (submitMatchScoreAction). L'avancement
 * du vainqueur est géré par le trigger SQL (M14).
 */
export function MatchScoreForm({ match, onSubmitted }: MatchScoreFormProps) {
  const [mode, setMode] = useState<Mode>('score')
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [forfeitPlayerId, setForfeitPlayerId] = useState<string | null>(null)
  const [forfeitReason, setForfeitReason] = useState('')
  const [pending, setPending] = useState(false)

  const pseudoA = match.playerAPseudo ?? 'Joueur A'
  const pseudoB = match.playerBPseudo ?? 'Joueur B'
  const isDraw = scoreA === scoreB

  async function handleScore() {
    if (isDraw || pending) return
    setPending(true)
    const res = await submitMatchScoreAction({
      mode: 'score',
      matchId: match.id,
      scoreA,
      scoreB,
    })
    setPending(false)
    if (res.success) {
      toast.success('Score enregistré.', {
        description: res.data.nextAlreadyPlayed
          ? 'Le match suivant était déjà joué : correction à vérifier.'
          : undefined,
      })
      onSubmitted()
    } else {
      toast.error(res.error)
    }
  }

  async function handleForfeit() {
    if (!forfeitPlayerId || pending) return
    setPending(true)
    const reason = forfeitReason.trim()
    const res = await submitMatchScoreAction({
      mode: 'forfeit',
      matchId: match.id,
      forfeitPlayerId,
      forfeitReason: reason.length > 0 ? reason : undefined,
    })
    setPending(false)
    if (res.success) {
      toast.success('Forfait enregistré.')
      onSubmitted()
    } else {
      toast.error(res.error)
    }
  }

  const forfeitWinner =
    forfeitPlayerId === null
      ? null
      : forfeitPlayerId === match.playerAId
        ? pseudoB
        : pseudoA

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-1 p-4">
      {/* Bascule Score / Forfait */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1">
        <SegButton active={mode === 'score'} onClick={() => setMode('score')}>
          Score
        </SegButton>
        <SegButton
          active={mode === 'forfeit'}
          onClick={() => setMode('forfeit')}
        >
          Forfait
        </SegButton>
      </div>

      {mode === 'score' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label={pseudoA}
              badge={match.playerABadge}
              value={scoreA}
              onChange={setScoreA}
            />
            <Stepper
              label={pseudoB}
              badge={match.playerBBadge}
              value={scoreB}
              onChange={setScoreB}
            />
          </div>

          {isDraw ? (
            <p className="text-center text-xs font-medium text-referee">
              Match nul impossible : il faut un vainqueur.
            </p>
          ) : null}

          <Button
            type="button"
            size="lg"
            disabled={isDraw || pending}
            onClick={handleScore}
            className="h-12 w-full bg-referee text-white hover:bg-referee/90"
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Trophy className="h-5 w-5" aria-hidden="true" />
            )}
            Valider le score
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Quel joueur déclare forfait ?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ForfeitButton
              label={pseudoA}
              active={forfeitPlayerId === match.playerAId}
              disabled={match.playerAId === null}
              onClick={() =>
                match.playerAId && setForfeitPlayerId(match.playerAId)
              }
            />
            <ForfeitButton
              label={pseudoB}
              active={forfeitPlayerId === match.playerBId}
              disabled={match.playerBId === null}
              onClick={() =>
                match.playerBId && setForfeitPlayerId(match.playerBId)
              }
            />
          </div>

          {forfeitWinner ? (
            <p className="text-center text-xs text-text-secondary">
              Vainqueur :{' '}
              <span className="font-semibold text-text-primary">
                {forfeitWinner}
              </span>
            </p>
          ) : null}

          <textarea
            value={forfeitReason}
            onChange={(e) => setForfeitReason(e.target.value)}
            placeholder="Motif (facultatif)"
            maxLength={200}
            rows={2}
            className={cn(
              'w-full resize-none rounded-lg bg-surface-2 px-3 py-2 text-sm text-text-primary',
              'placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-referee',
            )}
          />

          <Button
            type="button"
            size="lg"
            disabled={forfeitPlayerId === null || pending}
            onClick={handleForfeit}
            className="h-12 w-full bg-referee text-white hover:bg-referee/90"
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Flag className="h-5 w-5" aria-hidden="true" />
            )}
            Valider le forfait
          </Button>
        </>
      )}
    </div>
  )
}

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 rounded-md text-sm font-semibold transition-colors',
        active
          ? 'bg-referee text-white'
          : 'text-text-secondary hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}

function Stepper({
  label,
  badge,
  value,
  onChange,
}: {
  label: string
  badge: number | null
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-surface-2 px-2 py-3">
      <span className="flex max-w-full flex-col items-center">
        <span className="max-w-full truncate text-sm font-semibold text-text-primary">
          {label}
        </span>
        {badge !== null ? (
          <span className="text-[11px] text-text-muted">#{badge}</span>
        ) : null}
      </span>

      <span className="font-mono text-4xl font-bold tabular-nums text-text-primary">
        {value}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuer le score de ${label}`}
          disabled={value <= SCORE_MIN}
          onClick={() => onChange(Math.max(SCORE_MIN, value - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-text-primary transition-transform active:scale-95 disabled:opacity-40"
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Augmenter le score de ${label}`}
          disabled={value >= SCORE_MAX}
          onClick={() => onChange(Math.min(SCORE_MAX, value + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-referee text-white transition-transform active:scale-95 disabled:opacity-40"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function ForfeitButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'truncate rounded-lg px-3 py-3 text-sm font-semibold transition-colors',
        active
          ? 'bg-referee text-white'
          : 'bg-surface-2 text-text-secondary hover:text-text-primary',
        'disabled:opacity-40',
      )}
    >
      {label}
    </button>
  )
}