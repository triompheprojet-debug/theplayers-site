import { Banknote } from 'lucide-react'

import { cn } from '@/lib/utils'
import { MTNIcon } from '@/components/icons/MTNIcon'
import { AirtelIcon } from '@/components/icons/AirtelIcon'

type PaymentMethod = 'mtn_mobile_money' | 'airtel_money' | 'cash'
type Size = 'sm' | 'md' | 'lg'

interface PaymentMethodIconProps {
  method: PaymentMethod
  size?: Size
  className?: string
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

/**
 * Affiche l'icône correspondant à la méthode de paiement (Règle 3).
 *
 * Mapping :
 *  - mtn_mobile_money → cercle jaune MTN
 *  - airtel_money     → carré rouge Airtel
 *  - cash             → icône Banknote (lucide)
 */
export function PaymentMethodIcon({
  method,
  size = 'md',
  className,
}: PaymentMethodIconProps) {
  const sizeClass = cn(SIZE_CLASSES[size], className)

  switch (method) {
    case 'mtn_mobile_money':
      return <MTNIcon className={sizeClass} />
    case 'airtel_money':
      return <AirtelIcon className={sizeClass} />
    case 'cash':
      return <Banknote className={cn(sizeClass, 'text-success-neon')} aria-label="Espèces" />
  }
}