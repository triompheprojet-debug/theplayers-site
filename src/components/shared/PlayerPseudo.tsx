import { cn } from '@/lib/utils'

type PseudoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface PlayerPseudoProps {
  pseudo: string
  size?: PseudoSize
  /** Préfixe "@" optionnel (style mention) */
  withPrefix?: boolean
  className?: string
}

const SIZE_CLASSES: Record<PseudoSize, string> = {
  xs: 'text-sm',                                 // mentions, listes denses
  sm: 'text-base',                               // listes courantes
  md: 'text-lg font-semibold',                   // défaut
  lg: 'text-3xl font-bold tracking-tight',       // badge joueur, podium
  xl: 'text-6xl font-extrabold tracking-tight',  // dashboard confirmé (signature)
}

/**
 * Affichage standardisé d'un pseudo joueur (Règle 2 : le pseudo est l'identifiant principal).
 *
 * Tailles :
 *   xs (text-sm)   : listes denses, mentions inline
 *   sm (text-base) : listes
 *   md (text-lg)   : défaut, métadonnées
 *   lg (text-3xl)  : badge joueur, podium
 *   xl (text-6xl)  : dashboard joueur confirmé (signature visuelle)
 */
export function PlayerPseudo({
  pseudo,
  size = 'md',
  withPrefix = false,
  className,
}: PlayerPseudoProps) {
  return (
    <span
      className={cn(
        'text-text-primary inline-block wrap-break-words',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {withPrefix && <span className="text-text-muted">@</span>}
      {pseudo}
    </span>
  )
}