import { cn } from '@/lib/utils'
import { formatFCFA } from '@/lib/format/fcfa'

interface FCFAProps {
  amount: number
  /** Notation compacte : "3,5 k FCFA" au lieu de "3 500 FCFA" */
  short?: boolean
  /** Plus grand (hero, cash prizes) */
  large?: boolean
  /** Couleur + lueur vert néon (gain confirmé, cash prize) */
  neon?: boolean
  className?: string
}

/**
 * Montant FCFA standardisé (style maquette).
 * Le nombre est en JetBrains Mono ; le suffixe « FCFA » est plus petit.
 * Le formatage du nombre reste délégué à formatFCFA (source unique).
 */
export function FCFA({
  amount,
  short = false,
  large = false,
  neon = false,
  className,
}: FCFAProps) {
  const text = formatFCFA(amount, short)
  const hasSuffix = /FCFA\s*$/i.test(text)
  const value = hasSuffix ? text.replace(/\s*FCFA\s*$/i, '').trim() : text

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 whitespace-nowrap font-mono tabular-nums',
        large && 'text-3xl font-bold md:text-4xl',
        neon && 'text-success-neon [text-shadow:0_0_15px_rgba(34,255,136,0.6)]',
        className,
      )}
    >
      {value}
      {hasSuffix && (
        <span className={cn('font-semibold', large ? 'text-base md:text-lg' : 'text-[0.7em]')}>
          FCFA
        </span>
      )}
    </span>
  )
}