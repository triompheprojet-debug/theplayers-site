'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

/**
 * État d'erreur générique avec bouton "Réessayer" optionnel.
 *
 * Exemples :
 *   <ErrorState />                                          // message par défaut
 *   <ErrorState onRetry={() => refetch()} />               // avec retry
 *   <ErrorState title="Hors ligne" description="..." />    // custom
 */
export function ErrorState({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger les données. Vérifie ta connexion et réessaie.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'px-6 py-12 gap-3',
        className,
      )}
    >
      <AlertTriangle
        className="w-12 h-12 text-danger mb-2"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary max-w-md">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="mt-4">
          Réessayer
        </Button>
      )}
    </div>
  )
}