import 'server-only'

import { fromZonedTime } from 'date-fns-tz'

import { consoleForIndex, getActiveConsoleCount } from '@/lib/bracket/consoles'

import type { Json } from '@/types/database.types'

/**
 * Vagues (M14) — Règle 11 : TOUT vient de `tournaments.config` :
 *   - consoles.active_count            → matchs simultanés par vague
 *   - match.duration_minutes           → durée d'un match
 *   - match.break_minutes              → pause entre vagues
 *   - bracket.start_time ("HH:MM")     → début du round 1 (jour = start_date)
 *   - bracket.arrival_advance_minutes  → marge d'arrivée demandée au joueur
 *
 * Aucune valeur par défaut en dur : la moindre clé manquante → null, et
 * l'appelant (draw.ts / publishBracket) refuse avec `missing_config`.
 *
 * Les heures sont saisies en heure du Congo (Africa/Brazzaville, UTC+1) et
 * convertie en UTC pour le stockage timestamptz (cohérent avec format/dates.ts
 * qui reconvertit à l'affichage).
 */

/** Fuseau du tournoi : Congo (Brazzaville / Pointe-Noire), UTC+1, sans DST. */
const TZ = 'Africa/Brazzaville'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export interface BracketSettings {
  consoleCount: number
  matchDurationMinutes: number
  breakMinutes: number
  /** "HH:MM" — début du round 1, heure du Congo. */
  startTime: string
  arrivalAdvanceMinutes: number
}

function asRecord(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, Json | undefined>
}

function asPositiveInt(value: Json | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
    ? value
    : null
}

function asNonNegativeInt(value: Json | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null
}

/**
 * Extrait et valide l'ensemble des réglages nécessaires au planning du
 * bracket. Retourne null si une seule clé manque ou est invalide.
 */
export function getBracketSettings(config: Json): BracketSettings | null {
  const root = asRecord(config)
  if (!root) return null

  const consoleCount = getActiveConsoleCount(config)

  const match = asRecord(root.match)
  const matchDurationMinutes = asPositiveInt(match?.duration_minutes)
  const breakMinutes = asNonNegativeInt(match?.break_minutes)

  const bracket = asRecord(root.bracket)
  const startTimeRaw = bracket?.start_time
  const startTime =
    typeof startTimeRaw === 'string' && TIME_PATTERN.test(startTimeRaw)
      ? startTimeRaw
      : null
  const arrivalAdvanceMinutes = asNonNegativeInt(bracket?.arrival_advance_minutes)

  if (
    consoleCount === null ||
    matchDurationMinutes === null ||
    breakMinutes === null ||
    startTime === null ||
    arrivalAdvanceMinutes === null
  ) {
    return null
  }

  return {
    consoleCount,
    matchDurationMinutes,
    breakMinutes,
    startTime,
    arrivalAdvanceMinutes,
  }
}

/** Durée d'une vague (match + pause), en minutes. */
export function waveDurationMinutes(settings: BracketSettings): number {
  return settings.matchDurationMinutes + settings.breakMinutes
}

/**
 * Instant UTC du début du round 1 : `start_date` du tournoi (YYYY-MM-DD)
 * + `bracket.start_time`, interprétés en heure du Congo.
 */
export function getRound1StartUtc(
  tournamentStartDate: string,
  settings: BracketSettings,
): Date {
  return fromZonedTime(`${tournamentStartDate}T${settings.startTime}:00`, TZ)
}

/** Planning d'un match du round 1. */
export interface WaveSlot {
  /** 1-indexé. */
  waveNumber: number
  /** 1-indexé, rotation sur les consoles. */
  consoleNumber: number
  /** ISO UTC — début de la vague du match. */
  scheduledTime: string
}

/**
 * Planifie `matchCount` matchs du round 1 en vagues successives :
 * vague 1 = matchs 1..consoleCount à start, vague 2 ensuite, etc.
 * L'index i est 0-indexé sur la séquence des matchs RÉELLEMENT créés
 * (les byes ne consomment ni console ni créneau).
 */
export function planRound1Waves(
  matchCount: number,
  tournamentStartDate: string,
  settings: BracketSettings,
): WaveSlot[] {
  const startUtc = getRound1StartUtc(tournamentStartDate, settings)
  const waveMs = waveDurationMinutes(settings) * 60_000

  return Array.from({ length: matchCount }, (_, i) => {
    const waveNumber = Math.floor(i / settings.consoleCount) + 1
    return {
      waveNumber,
      consoleNumber: consoleForIndex(i, settings.consoleCount),
      scheduledTime: new Date(
        startUtc.getTime() + (waveNumber - 1) * waveMs,
      ).toISOString(),
    }
  })
}

/**
 * Heure d'arrivée demandée au joueur : début de sa vague moins la marge
 * configurée (`bracket.arrival_advance_minutes`).
 */
export function computeArrivalTime(
  scheduledTimeIso: string,
  settings: BracketSettings,
): Date {
  return new Date(
    new Date(scheduledTimeIso).getTime() -
      settings.arrivalAdvanceMinutes * 60_000,
  )
}