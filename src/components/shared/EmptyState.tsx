import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * État vide générique (aucune donnée, liste vide, etc.).
 *
 * Exemples :
 *   <EmptyState title="Aucune inscription pour l'instant" />
 *   <EmptyState
 *     icon={Trophy}
 *     title="Aucun tournoi actif"
 *     description="Le prochain démarre bientôt."
 *     action={<Button>Voir l'historique</Button>}
 *   />
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'px-6 py-12 gap-3',
        className,
      )}
    >
      <Icon
        className="w-12 h-12 text-text-muted mb-2"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}