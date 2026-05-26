import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface LoadingSpinnerProps {
  size?: Size
  /** Centrage automatique dans son conteneur (utile pour pages entières) */
  fullscreen?: boolean
  /** Couleur (défaut : accent-violet) */
  className?: string
  /** Libellé accessible (lu par les lecteurs d'écran) */
  label?: string
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
}

/**
 * Spinner standardisé du design system.
 *
 * Exemples :
 *   <LoadingSpinner />                       // taille md, violet
 *   <LoadingSpinner size="xl" fullscreen />  // pleine page (loading initial)
 *   <LoadingSpinner size="sm" className="text-success-neon" />
 */
export function LoadingSpinner({
  size = 'md',
  fullscreen = false,
  className,
  label = 'Chargement en cours',
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn(
        'animate-spin text-accent-violet',
        SIZE_CLASSES[size],
        className,
      )}
      strokeWidth={2}
      role="status"
      aria-label={label}
    />
  )

  if (fullscreen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {spinner}
      </div>
    )
  }
  return spinner
}