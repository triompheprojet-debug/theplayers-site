/**
 * Affichage de temps relatif en français : "il y a 3 minutes", "dans 2 jours".
 * Utilise date-fns + locale fr.
 */
import { formatDistanceToNow, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

function toDate(input: Date | string): Date {
  return typeof input === 'string' ? parseISO(input) : input
}

/**
 * "il y a environ 2 heures" / "dans 3 jours"
 */
export function relativeTime(input: Date | string): string {
  return formatDistanceToNow(toDate(input), {
    locale: fr,
    addSuffix: true,
  })
}

/**
 * Variante stricte : "2 heures", "3 jours" — sans suffixe.
 */
export function relativeDuration(input: Date | string): string {
  return formatDistanceToNowStrict(toDate(input), { locale: fr })
}