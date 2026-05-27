'use client'

/**
 * Pavé numérique 4×3 pour saisie du PIN admin (M02).
 *
 * Composant contrôlé : le parent gère la valeur via `value` + `onChange`.
 * Auto-déclenche `onComplete(pin)` quand `value.length === maxLength`.
 *
 * Accessibilité :
 *  - Touch targets 80×80 (DESIGN.md §15, supérieur aux 48px requis Règle 7)
 *  - Support clavier (chiffres 0-9 + Backspace)
 *  - aria-label sur chaque touche
 *  - Indicateur live du nombre de chiffres saisis
 *
 * Animations :
 *  - active:scale-95 sur tap
 *  - animate-shake sur erreur (déclenché par la prop `error`)
 *  - Vibration légère sur mobile (50ms) si l'API est disponible
 */
import { useCallback, useEffect } from 'react'
import { Delete } from 'lucide-react'

import { cn } from '@/lib/utils'

interface PinPadProps {
  value: string
  onChange: (next: string) => void
  onComplete?: (pin: string) => void
  maxLength?: number
  disabled?: boolean
  error?: boolean
}

// Layout : [' ', '0', 'backspace'] sur la dernière ligne
// (la touche vide à gauche garde la symétrie visuelle ; submit auto à la longueur max)
const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'backspace'],
] as const

const BUTTON_BASE =
  'flex h-20 w-20 items-center justify-center rounded-2xl ' +
  'bg-surface-2 text-text-primary transition-all ' +
  'hover:bg-surface-3 ' +
  'active:scale-95 active:bg-accent-violet/20 ' +
  'disabled:opacity-40 disabled:active:scale-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-violet'

export function PinPad({
  value,
  onChange,
  onComplete,
  maxLength = 6,
  disabled = false,
  error = false,
}: PinPadProps) {
  const vibrate = useCallback(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(50)
    }
  }, [])

  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled || value.length >= maxLength) return
      vibrate()
      const next = value + digit
      onChange(next)
      if (next.length === maxLength) {
        onComplete?.(next)
      }
    },
    [disabled, maxLength, onChange, onComplete, value, vibrate],
  )

  const handleBackspace = useCallback(() => {
    if (disabled || value.length === 0) return
    vibrate()
    onChange(value.slice(0, -1))
  }, [disabled, onChange, value, vibrate])

  // Support clavier physique (utile sur desktop)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return
      // Ignore si l'utilisateur tape dans un input (ex: champ username)
      const target = e.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return
      }
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, handleDigit, handleBackspace])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Indicateurs : 6 cercles qui se remplissent */}
      <div
        className={cn(
          'flex items-center gap-3',
          error && 'animate-shake',
        )}
        role="status"
        aria-live="polite"
        aria-label={`PIN : ${value.length} sur ${maxLength} chiffres saisis`}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              'h-3 w-3 rounded-full transition-colors duration-150',
              i < value.length
                ? error
                  ? 'bg-red-500'
                  : 'bg-accent-violet'
                : 'bg-surface-3',
            )}
          />
        ))}
      </div>

      {/* Grille 4×3 */}
      <div
        className="grid grid-cols-3 gap-3"
        role="group"
        aria-label="Pavé numérique de saisie du PIN"
      >
        {KEYS.flat().map((key, idx) => {
          if (key === '') {
            return <div key={`empty-${idx}`} aria-hidden />
          }
          if (key === 'backspace') {
            return (
              <button
                key="backspace"
                type="button"
                onClick={handleBackspace}
                disabled={disabled || value.length === 0}
                className={BUTTON_BASE}
                aria-label="Effacer le dernier chiffre"
              >
                <Delete className="h-6 w-6" aria-hidden />
              </button>
            )
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleDigit(key)}
              disabled={disabled || value.length >= maxLength}
              className={cn(BUTTON_BASE, 'text-2xl font-bold')}
              aria-label={`Saisir le chiffre ${key}`}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}