import { cn } from '@/lib/utils'
import {
  formatDate,
  formatDateRange,
  formatDateTime,
} from '@/lib/format/dates'

interface DateBadgeBaseProps {
  className?: string
}

interface DateBadgeRangeProps extends DateBadgeBaseProps {
  from: Date | string
  to: Date | string
  date?: never
  withTime?: never
}

interface DateBadgeSingleProps extends DateBadgeBaseProps {
  date: Date | string
  withTime?: string                       // "14:00"
  from?: never
  to?: never
}

type DateBadgeProps = DateBadgeRangeProps | DateBadgeSingleProps

/**
 * Affichage standardisé de dates en français.
 *
 * Exemples :
 *   <DateBadge from="2026-06-13" to="2026-06-14" />     → "13-14 juin 2026"
 *   <DateBadge date="2026-06-13" />                     → "13 juin 2026"
 *   <DateBadge date="2026-06-13" withTime="14:00" />    → "13 juin 2026 à 14h00"
 *
 * Le typage discriminant garantit qu'on n'utilise pas
 * from/to ET date en même temps.
 */
export function DateBadge(props: DateBadgeProps) {
  const { className } = props

  let display: string
  if ('from' in props && props.from && props.to) {
    display = formatDateRange(props.from, props.to)
  } else if ('date' in props && props.date) {
    display = props.withTime
      ? formatDateTime(props.date, props.withTime)
      : formatDate(props.date)
  } else {
    display = ''
  }

  return (
    <span className={cn('text-text-secondary tabular-nums', className)}>
      {display}
    </span>
  )
}