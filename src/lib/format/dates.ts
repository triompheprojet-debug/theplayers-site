/**
 * Formatage de dates en français (locale 'fr' de date-fns), TOUJOURS en heure
 * du Congo (Africa/Brazzaville, UTC+1).
 *
 * Les dates sont stockées en UTC (timestamptz). On force le fuseau À L'AFFICHAGE
 * pour éviter le décalage selon l'endroit où le code s'exécute
 * (serveur Vercel en UTC vs navigateur). Ne jamais utiliser .toLocaleString()
 * direct ni format() sans fuseau.
 */
import { parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

/** Fuseau du tournoi : Congo (Brazzaville / Pointe-Noire), UTC+1, sans DST. */
const TZ = 'Africa/Brazzaville'

/** Accepte une date au format Date, ISO string, ou timestamptz. */
function toDate(input: Date | string): Date {
  return typeof input === 'string' ? parseISO(input) : input
}

/** "13 juin 2026" */
export function formatDate(input: Date | string): string {
  return formatInTimeZone(toDate(input), TZ, 'd MMMM yyyy', { locale: fr })
}

/**
 * "13-14 juin 2026" — même mois
 * "30 juin – 1 juillet 2026" — mois différents
 * "31 décembre 2025 – 2 janvier 2026" — années différentes
 */
export function formatDateRange(from: Date | string, to: Date | string): string {
  const fromDate = toDate(from)
  const toDate_ = toDate(to)

  // Comparaison faite en heure du Congo (évite les erreurs en bord de mois/année).
  const fromZoned = toZonedTime(fromDate, TZ)
  const toZoned = toZonedTime(toDate_, TZ)
  const sameYear = fromZoned.getFullYear() === toZoned.getFullYear()
  const sameMonth = sameYear && fromZoned.getMonth() === toZoned.getMonth()

  if (sameMonth) {
    return `${formatInTimeZone(fromDate, TZ, 'd', { locale: fr })}-${formatInTimeZone(toDate_, TZ, 'd MMMM yyyy', { locale: fr })}`
  }
  if (sameYear) {
    return `${formatInTimeZone(fromDate, TZ, 'd MMMM', { locale: fr })} – ${formatInTimeZone(toDate_, TZ, 'd MMMM yyyy', { locale: fr })}`
  }
  return `${formatInTimeZone(fromDate, TZ, 'd MMMM yyyy', { locale: fr })} – ${formatInTimeZone(toDate_, TZ, 'd MMMM yyyy', { locale: fr })}`
}

/** "13 juin 2026 à 14h00" */
export function formatDateTime(input: Date | string, time?: string): string {
  const base = formatDate(input)
  if (time) {
    return `${base} à ${time.replace(':', 'h')}`
  }
  return `${base} à ${formatInTimeZone(toDate(input), TZ, 'HH\\hmm', { locale: fr })}`
}

/** "13/06/2026" — usage compact (tableaux admin) */
export function formatDateCompact(input: Date | string): string {
  return formatInTimeZone(toDate(input), TZ, 'dd/MM/yyyy', { locale: fr })
}

/** "14:00" — heure seule (24h) */
export function formatTime(input: Date | string): string {
  return formatInTimeZone(toDate(input), TZ, 'HH:mm', { locale: fr })
}