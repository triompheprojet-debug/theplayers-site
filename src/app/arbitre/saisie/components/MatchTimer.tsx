'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface MatchTimerProps {
  /** Durée cible du match (minutes) depuis la config — objectif indicatif. null = aucun objectif. */
  durationMinutes: number | null
}

/**
 * Chronomètre de match (jour J). Compte le temps écoulé (count-up) pour rester
 * simple et lisible ; si une durée cible est configurée, le chrono passe en
 * orange une fois dépassée.
 *
 * React 19 : pas de `Date.now()` dans le rendu (uniquement dans les handlers /
 * l'intervalle), pas de `setState` synchrone au montage — la mise à jour se
 * fait dans le callback de `setInterval` (asynchrone, autorisé).
 */
export function MatchTimer({ durationMinutes }: MatchTimerProps) {
  const [running, setRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current)
    }, 250)
    return () => clearInterval(id)
  }, [running])

  function toggle() {
    if (running) {
      setRunning(false)
      return
    }
    startRef.current = Date.now() - elapsedMs
    setRunning(true)
  }

  function reset() {
    setRunning(false)
    setElapsedMs(0)
  }

  const totalSec = Math.floor(elapsedMs / 1000)
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')
  const over = durationMinutes !== null && totalSec >= durationMinutes * 60

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-1 px-4 py-3">
      <div className="flex flex-col">
        <span
          className={cn(
            'font-mono text-4xl font-bold tabular-nums leading-none',
            over ? 'text-referee' : 'text-text-primary',
          )}
        >
          {mm}:{ss}
        </span>
        {durationMinutes !== null ? (
          <span className="mt-1 text-[11px] uppercase tracking-wide text-text-muted">
            Objectif {durationMinutes}:00
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={running ? 'Mettre en pause' : 'Démarrer'}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full text-white',
            'transition-transform active:scale-95',
            running ? 'bg-text-muted' : 'bg-referee',
          )}
        >
          {running ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Réinitialiser le chronomètre"
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            'bg-surface-2 text-text-secondary transition-transform active:scale-95',
          )}
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}