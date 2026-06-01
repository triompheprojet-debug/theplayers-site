'use client'

/**
 * Interrupteur "Inscriptions ouvertes / fermées" du tournoi actif (M04).
 *
 * - Client Component (Switch shadcn + toast sonner)
 * - UI optimiste : on bascule immédiatement, rollback en cas d'échec serveur
 * - Écrit tournaments.is_registrations_open via toggleRegistrationsAction
 */
import { Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import { toggleRegistrationsAction } from '../actions'

interface RegistrationsToggleProps {
  tournamentId: string
  initialIsOpen: boolean
}

export function RegistrationsToggle({
  tournamentId,
  initialIsOpen,
}: RegistrationsToggleProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen)
  const [isPending, startTransition] = useTransition()

  const handleChange = (next: boolean) => {
    // Optimiste
    setIsOpen(next)

    startTransition(async () => {
      const result = await toggleRegistrationsAction({
        tournamentId,
        isOpen: next,
      })

      if (result.success) {
        toast.success(
          next ? 'Inscriptions ouvertes.' : 'Inscriptions fermées.',
        )
      } else {
        // Rollback
        setIsOpen(!next)
        toast.error(result.error)
      }
    })
  }

  return (
    <section className="rounded-xl bg-surface-1 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Inscriptions
          </p>
          <p className="mt-1 text-lg font-semibold text-text-primary">
            {isOpen ? 'Ouvertes' : 'Fermées'}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {isOpen
              ? 'Les joueurs peuvent s\'inscrire au tournoi actif.'
              : 'Les nouvelles inscriptions sont bloquées.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPending && (
            <Loader2
              className="size-4 animate-spin text-text-secondary"
              aria-hidden
            />
          )}
          <Switch
            checked={isOpen}
            onCheckedChange={handleChange}
            disabled={isPending}
            aria-label="Ouvrir ou fermer les inscriptions"
            className={cn(isOpen && 'data-[state=checked]:bg-success-neon')}
          />
        </div>
      </div>
    </section>
  )
}