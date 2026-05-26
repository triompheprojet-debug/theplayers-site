import { cn } from '@/lib/utils'

type BrandLogoVariant = 'default' | 'white' | 'small'

interface BrandLogoProps {
  variant?: BrandLogoVariant
  withText?: boolean         // affiche le sous-titre "Liga Esport FC"
  className?: string
}

/**
 * Logo wordmark "THE PLAYERS" — version SVG sans dépendance à un fichier image.
 *
 * Variantes :
 *  - default : "THE" violet, "PLAYERS" blanc
 *  - white   : tout blanc (sur surface accent)
 *  - small   : version compacte (header mobile)
 *
 * Si tu veux remplacer plus tard par /public/images/logo-theplayers.png,
 * troquer le <svg> contre <Image src="..." />.
 */
export function BrandLogo({
  variant = 'default',
  withText = false,
  className,
}: BrandLogoProps) {
  const small = variant === 'small'
  const allWhite = variant === 'white'

  return (
    <div className={cn('inline-flex flex-col select-none', className)}>
      <div
        className={cn(
          'flex items-baseline gap-1 font-black tracking-tight leading-none',
          small ? 'text-lg' : 'text-3xl',
        )}
      >
        <span
          className={cn(
            allWhite ? 'text-text-primary' : 'text-accent-violet',
          )}
        >
          THE
        </span>
        <span className="text-text-primary">PLAYERS</span>
      </div>

      {withText && (
        <span
          className={cn(
            'mt-1 text-text-secondary uppercase tracking-widest font-semibold',
            small ? 'text-[10px]' : 'text-xs',
          )}
        >
          Liga Esport FC
        </span>
      )}
    </div>
  )
}