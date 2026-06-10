'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  targetDate: Date | string
  /** Callback déclenché une fois quand le compte à rebours atteint zéro */
  onExpire?: () => void
  /** Affiche les secondes (défaut : true si < 1h restante, sinon false) */
  showSeconds?: boolean
  /** 'inline' (défaut) = chaîne compacte ; 'boxes' = 4 cases (hero) */
  variant?: 'inline' | 'boxes'
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

// --- External store : tick "now" chaque seconde --------------------------

// "now" mis en cache au niveau module.
// CRITIQUE : getSnapshot DOIT renvoyer une valeur STABLE entre deux ticks.
// Renvoyer Date.now() directement fait croire à React que le store change
// à CHAQUE lecture (valeur différente à chaque milliseconde) → rendu en
// boucle infinie ("Maximum update depth exceeded"). On ne rafraîchit le
// cache QUE dans le tick de l'intervalle.
let cachedNow = Date.now()

function subscribe(callback: () => void): () => void {
  const interval = setInterval(() => {
    cachedNow = Date.now()
    callback()
  }, 1000)
  return () => clearInterval(interval)
}

const getClientSnapshot = (): number => cachedNow
// Sentinelle 0 côté serveur (signal "pas encore monté")
const getServerSnapshot = (): number => 0

// --- Helpers --------------------------------------------------------------

function computeTimeLeft(targetMs: number, nowMs: number): TimeLeft {
  const diff = targetMs - nowMs
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    expired: false,
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// Rendu en cases (Jours / Heures / Min / Sec). No-Line, pas de glassmorphism
// (réservé à la navigation) : tons de surface pleins.
function Boxes({
  cells,
  className,
}: {
  cells: Array<{ value: string; label: string }>
  className?: string
}) {
  return (
    <div className={cn('flex items-stretch gap-2', className)} aria-live="polite">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg bg-surface-1 px-2 py-3"
        >
          <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
            {cell.value}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- Component ------------------------------------------------------------

/**
 * Compte à rebours live (mise à jour chaque seconde).
 *
 * Implémentation React 19-safe via useSyncExternalStore :
 *  - Pas de setState dans useEffect (évite "cascading renders")
 *  - SSR safe : sentinelle 0 côté serveur, vraie valeur côté client
 *  - Hydration safe : le mismatch est résolu naturellement par React
 *
 * variant='inline' :  > 1j → "3j 14:25:08" / < 1j → "14:25:08" / expiré → "Terminé"
 * variant='boxes'  :  4 cases Jours/Heures/Min/Sec (hero accueil)
 */
export function CountdownTimer({
  targetDate,
  onExpire,
  showSeconds,
  variant = 'inline',
  className,
}: CountdownTimerProps) {
  // Conversion target → timestamp (pure)
  const targetMs =
    typeof targetDate === 'string'
      ? new Date(targetDate).getTime()
      : targetDate.getTime()

  // Tick chaque seconde via useSyncExternalStore (API React 19 idiomatique)
  const nowMs = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )

  // Trigger onExpire une seule fois quand le temps tombe à zéro
  const expireCalledRef = useRef(false)
  useEffect(() => {
    if (nowMs > 0 && nowMs >= targetMs && !expireCalledRef.current) {
      expireCalledRef.current = true
      onExpire?.()
    }
  }, [nowMs, targetMs, onExpire])

  // Reset si on change de cible
  useEffect(() => {
    expireCalledRef.current = false
  }, [targetMs])

  // Placeholder côté serveur (nowMs === 0 = sentinelle)
  if (nowMs === 0) {
    if (variant === 'boxes') {
      return (
        <Boxes
          className={className}
          cells={[
            { value: '--', label: 'Jours' },
            { value: '--', label: 'Heures' },
            { value: '--', label: 'Min' },
            { value: '--', label: 'Sec' },
          ]}
        />
      )
    }
    return (
      <span
        className={cn('font-mono tabular-nums text-text-muted', className)}
        aria-live="polite"
      >
        --:--:--
      </span>
    )
  }

  const timeLeft = computeTimeLeft(targetMs, nowMs)

  if (timeLeft.expired) {
    return (
      <span
        className={cn(
          'font-semibold uppercase tracking-wider text-danger',
          className,
        )}
      >
        Terminé
      </span>
    )
  }

  const { days, hours, minutes, seconds } = timeLeft

  if (variant === 'boxes') {
    return (
      <Boxes
        className={className}
        cells={[
          { value: pad(days), label: 'Jours' },
          { value: pad(hours), label: 'Heures' },
          { value: pad(minutes), label: 'Min' },
          { value: pad(seconds), label: 'Sec' },
        ]}
      />
    )
  }

  const showSecs = showSeconds ?? (days === 0 && hours === 0)

  return (
    <span
      className={cn('font-mono tabular-nums font-bold', className)}
      aria-live="polite"
    >
      {days > 0 && <span className="text-accent-violet">{days}j </span>}
      <span>
        {pad(hours)}:{pad(minutes)}
        {showSecs && `:${pad(seconds)}`}
      </span>
    </span>
  )
}