'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

import { createReservation } from '../actions'

/**
 * Bouton de réservation (Client).
 *
 * Inclut le honeypot anti-bot (`website`, masqué, doit rester vide).
 * En cas de succès → redirige vers le paiement (M09) ; sinon toast d'erreur.
 */
export function ReserveButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  async function handleClick() {
    setIsPending(true)
    const result = await createReservation({ website: honeypot })
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Place réservée. Finalise ton paiement.')
    router.push(ROUTES.player.payment)
    router.refresh()
  }

  return (
    <div>
      {/* Honeypot anti-bot — invisible, hors flux tab */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <Button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="min-h-[52px] w-full bg-accent-violet text-white hover:bg-accent-violet/90"
      >
        {isPending ? 'Réservation…' : 'Réserver ma place'}
        {!isPending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </div>
  )
}