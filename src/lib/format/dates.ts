/**
 * Formatage de dates en français (locale 'fr' de date-fns).
 *
 * Toutes les dates affichées doivent passer par ces helpers — jamais de
 * .toLocaleDateString() direct (incohérences cross-browser).
 */
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Accepte une date au format Date, ISO string, ou timestamptz.
 */
function toDate(input: Date | string): Date {
  return typeof input === 'string' ? parseISO(input) : input
}

/**
 * "13 juin 2026"
 */
export function formatDate(input: Date | string): string {
  return format(toDate(input), 'd MMMM yyyy', { locale: fr })
}

/**
 * "13-14 juin 2026" — même mois
 * "30 juin – 1 juillet 2026" — mois différents
 * "31 décembre 2025 – 2 janvier 2026" — années différentes
 */
export function formatDateRange(from: Date | string, to: Date | string): string {
  const fromDate = toDate(from)
  const toDate_ = toDate(to)

  const sameYear = fromDate.getFullYear() === toDate_.getFullYear()
  const sameMonth = sameYear && fromDate.getMonth() === toDate_.getMonth()

  if (sameMonth) {
    return `${format(fromDate, 'd', { locale: fr })}-${format(toDate_, 'd MMMM yyyy', { locale: fr })}`
  }
  if (sameYear) {
    return `${format(fromDate, 'd MMMM', { locale: fr })} – ${format(toDate_, 'd MMMM yyyy', { locale: fr })}`
  }
  return `${format(fromDate, 'd MMMM yyyy', { locale: fr })} – ${format(toDate_, 'd MMMM yyyy', { locale: fr })}`
}

/**
 * "13 juin 2026 à 14h00"
 */
export function formatDateTime(input: Date | string, time?: string): string {
  const base = formatDate(input)
  if (time) {
    return `${base} à ${time.replace(':', 'h')}`
  }
  return `${base} à ${format(toDate(input), 'HH\\hmm', { locale: fr })}`
}

/**
 * "13/06/2026" — usage compact (tableaux admin)
 */
export function formatDateCompact(input: Date | string): string {
  return format(toDate(input), 'dd/MM/yyyy', { locale: fr })
}

/**
 * "14:00" — heure seule (24h)
 */
export function formatTime(input: Date | string): string {
  return format(toDate(input), 'HH:mm', { locale: fr })
}