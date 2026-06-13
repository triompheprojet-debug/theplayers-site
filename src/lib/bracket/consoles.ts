import 'server-only'

import type { Json } from '@/types/database.types'

/**
 * Consoles (M14) — Règle 11 : le nombre de consoles vient EXCLUSIVEMENT de
 * `tournaments.config.consoles.active_count`. Aucune valeur par défaut en
 * dur : config absente ou invalide → null, et l'appelant refuse l'opération
 * (motif `missing_config`).
 */

/**
 * Lit `config.consoles.active_count` du tournoi. Retourne null si absent ou
 * invalide (doit être un entier >= 1).
 */
export function getActiveConsoleCount(config: Json): number | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return null
  }
  const consoles = (config as Record<string, Json | undefined>).consoles
  if (!consoles || typeof consoles !== 'object' || Array.isArray(consoles)) {
    return null
  }
  const raw = (consoles as Record<string, Json | undefined>).active_count
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1) {
    return null
  }
  return raw
}

/**
 * Numéro de console (1-indexé) pour le i-ème match d'une séquence
 * (i 0-indexé) : rotation sur les consoles disponibles.
 */
export function consoleForIndex(index: number, consoleCount: number): number {
  return (index % consoleCount) + 1
}