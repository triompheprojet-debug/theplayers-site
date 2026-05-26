import { cn } from '@/lib/utils'
import { formatFCFA } from '@/lib/format/fcfa'

interface FCFAProps {
  amount: number
  /** Notation compacte : "3,5 k FCFA" au lieu de "3 500 FCFA" */
  short?: boolean
  /** Plus grand : text-2xl + font-bold (hero, cash prizes) */
  large?: boolean
  /** Couleur vert néon (gain confirmé, cash prize) */
  neon?: boolean
  className?: string
}

/**
 * Affichage standardisé d'un montant en FCFA.
 *
 * Exemples :
 *   <FCFA amount={3500} />               → "3 500 FCFA"
 *   <FCFA amount={100000} large />       → "100 000 FCFA" en grand
 *   <FCFA amount={100000} neon large />  → grand + vert néon (cash prize)
 *   <FCFA amount={3500} short />         → "3,5 k FCFA"
 */
export function FCFA({
  amount,
  short = false,
  large = false,
  neon = false,
  className,
}: FCFAProps) {
  return (
    <span
      className={cn(
        'whitespace-nowrap font-mono tabular-nums',
        large && 'text-2xl font-bold',
        neon && 'text-success-neon',
        className,
      )}
    >
      {formatFCFA(amount, short)}
    </span>
  )
}