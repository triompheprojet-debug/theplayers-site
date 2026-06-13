'use client'

import { useState, useTransition } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { submitForfeitAction, submitScoreAction } from '../actions'

import type { AdminBracketMatch } from '@/lib/bracket/read'

/**
 * Saisie de score / forfait d'un match (M14, réutilisé M15).
 *
 * Le conteneur (`ScoreEntryModal`) ne fait que piloter l'ouverture du Dialog
 * selon `match` (null = fermé). Le formulaire (`ScoreEntryForm`) est monté avec
 * `key={match.id}` : à chaque match différent il est remonté, donc ses
 * `useState` repartent de zéro depuis les valeurs du match — AUCUN `useEffect`
 * de réinitialisation (évite `react-hooks/set-state-in-effect`).
 */
interface ScoreEntryModalProps {
  match: AdminBracketMatch | null
  onClose: () => void
  onDone: () => void
}

export function ScoreEntryModal({
  match,
  onClose,
  onDone,
}: ScoreEntryModalProps) {
  return (
    <Dialog open={Boolean(match)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {match && (
          <ScoreEntryForm
            key={match.id}
            match={match}
            onClose={onClose}
            onDone={onDone}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type Mode = 'score' | 'forfeit'

function ScoreEntryForm({
  match,
  onClose,
  onDone,
}: {
  match: AdminBracketMatch
  onClose: () => void
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<Mode>('score')
  const [scoreA, setScoreA] = useState(
    match.scoreA != null ? String(match.scoreA) : '',
  )
  const [scoreB, setScoreB] = useState(
    match.scoreB != null ? String(match.scoreB) : '',
  )
  const [forfeitPlayer, setForfeitPlayer] = useState<'a' | 'b' | null>(null)
  const [forfeitReason, setForfeitReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const labelA = match.playerAPseudo ?? 'Joueur A'
  const labelB = match.playerBPseudo ?? 'Joueur B'

  function handleSubmitScore() {
    setError(null)
    const a = Number(scoreA)
    const b = Number(scoreB)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError('Saisissez deux scores entiers positifs.')
      return
    }
    if (a === b) {
      setError('Match nul impossible : il faut un vainqueur.')
      return
    }
    startTransition(async () => {
      const result = await submitScoreAction({
        matchId: match.id,
        scoreA: a,
        scoreB: b,
      })
      if (result.success) {
        toast.success('Score enregistré.')
        if (result.data.nextAlreadyPlayed) {
          toast.warning(
            'Le match suivant était déjà joué : vérifiez la suite du bracket.',
          )
        }
        onDone()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  function handleSubmitForfeit() {
    setError(null)
    if (!forfeitPlayer) {
      setError('Sélectionnez le joueur déclarant forfait.')
      return
    }
    const forfeitPlayerId =
      forfeitPlayer === 'a' ? match.playerAId : match.playerBId
    if (!forfeitPlayerId) {
      setError('Joueur invalide.')
      return
    }
    startTransition(async () => {
      const result = await submitForfeitAction({
        matchId: match.id,
        forfeitPlayerId,
        forfeitReason: forfeitReason.trim() || undefined,
      })
      if (result.success) {
        toast.success('Forfait enregistré.')
        if (result.data.nextAlreadyPlayed) {
          toast.warning(
            'Le match suivant était déjà joué : vérifiez la suite du bracket.',
          )
        }
        onDone()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {match.bracketPosition ?? `Match ${match.matchNumber}`}
        </DialogTitle>
        <DialogDescription>
          {labelA} contre {labelB}
        </DialogDescription>
      </DialogHeader>

      {/* Sélecteur de mode */}
      <div className="flex items-center rounded-lg bg-surface-2 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode('score')}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 transition-colors',
            mode === 'score'
              ? 'bg-surface-1 text-text-primary'
              : 'text-text-muted',
          )}
        >
          Score
        </button>
        <button
          type="button"
          onClick={() => setMode('forfeit')}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 transition-colors',
            mode === 'forfeit'
              ? 'bg-surface-1 text-text-primary'
              : 'text-text-muted',
          )}
        >
          Forfait
        </button>
      </div>

      {mode === 'score' ? (
        <div className="space-y-3">
          <ScoreField
            id={`score-a-${match.id}`}
            label={labelA}
            value={scoreA}
            onChange={setScoreA}
          />
          <ScoreField
            id={`score-b-${match.id}`}
            label={labelB}
            value={scoreB}
            onChange={setScoreB}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Sélectionnez le joueur déclarant forfait. Son adversaire est déclaré
            vainqueur.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ForfeitChoice
              label={labelA}
              selected={forfeitPlayer === 'a'}
              onSelect={() => setForfeitPlayer('a')}
            />
            <ForfeitChoice
              label={labelB}
              selected={forfeitPlayer === 'b'}
              onSelect={() => setForfeitPlayer('b')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`forfeit-reason-${match.id}`}>
              Motif (facultatif)
            </Label>
            <textarea
              id={`forfeit-reason-${match.id}`}
              value={forfeitReason}
              onChange={(e) => setForfeitReason(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Ex : joueur absent, abandon…"
              className="w-full rounded-md bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-violet"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Annuler
        </Button>
        <Button
          onClick={mode === 'score' ? handleSubmitScore : handleSubmitForfeit}
          disabled={isPending}
        >
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Enregistrer
        </Button>
      </DialogFooter>
    </>
  )
}

function ScoreField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="min-w-0 flex-1 truncate">
        {label}
      </Label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded-md bg-surface-2 px-3 py-2 text-center text-sm tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-violet"
      />
    </div>
  )
}

function ForfeitChoice({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'truncate rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
        selected
          ? 'bg-danger/15 text-danger'
          : 'bg-surface-2 text-text-secondary hover:text-text-primary',
      )}
    >
      {label}
    </button>
  )
}