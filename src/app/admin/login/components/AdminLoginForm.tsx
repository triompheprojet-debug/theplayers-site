'use client'

/**
 * Formulaire de connexion admin (M02).
 *
 * Orchestration :
 * - Champ username (Input shadcn)
 * - PinPad (state contrôlé)
 * - Auto-submit dès que le PIN atteint 6 chiffres
 * - useTransition pour l'état loading
 * - Reset PIN + animation shake en cas d'erreur
 * - Affichage du temps restant si compte verrouillé
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

import { adminSignIn } from '../actions'
import { PinPad } from './PinPad'

const PIN_LENGTH = 6

export function AdminLoginForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  // 1. Gestion de l'animation de secousse (shake)
  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  // 2. Gestion du changement de valeur du PIN
  const handlePinChange = (next: string) => {
    setPin(next)
  }

  function submit(pinValue: string) {
    if (isPending) return
    if (!username.trim()) {
      setError("Saisis ton nom d'utilisateur.")
      triggerShake()
      return
    }
    setError(null)

    // 3. Ajout de async pour permettre le await à l'intérieur
    startTransition(async () => {
      const res = await adminSignIn({ username, pin: pinValue })
      
      // 4. Alignement sur le type ActionResult (success au lieu de ok)
      if (!res.success) {
        setError(res.error)
        setPin('') // Réinitialise le pavé numérique en cas d'erreur
        triggerShake()
      } else {
        router.push(res.data.redirect)
      }
    })
  }

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      {/* Identifiant */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-username" className="text-sm font-medium text-text-secondary">
          Identifiant
        </Label>
        <Input
          id="admin-username"
          type="text"
          autoComplete="username"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isPending}
          maxLength={20}
          aria-describedby={error ? 'admin-login-error' : undefined}
        />
      </div>

      {/* PIN */}
      <div className="flex flex-col items-center gap-4">
        <Label className="text-xs uppercase tracking-wider text-text-secondary">
          Code PIN
        </Label>
        <PinPad
          value={pin}
          onChange={handlePinChange}
          onComplete={submit}
          maxLength={PIN_LENGTH}
          disabled={isPending}
          error={shake}
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <p
          id="admin-login-error"
          role="alert"
          className="text-center text-sm text-red-500"
        >
          {error}
        </p>
      )}

      {/* Bouton submit explicite (fallback si l'utilisateur préfère cliquer) */}
      <Button
        type="button"
        className="w-full"
        disabled={isPending || pin.length < PIN_LENGTH}
        onClick={() => submit(pin)}
      >
        {isPending ? 'Connexion...' : 'Se connecter'}
      </Button>
    </div>
  )
}