import 'server-only'

import { randomInt } from 'node:crypto'

/**
 * Placement des joueurs dans le bracket (M14).
 *
 * - Mélange Fisher-Yates avec aléa cryptographique (node:crypto.randomInt) :
 *   tirage au sort équitable et non reproductible.
 * - Taille de bracket = plus petite puissance de 2 >= nombre de joueurs.
 * - Byes (exemptions) : au plus UN bye par match du round 1, répartis sur des
 *   matchs tirés au hasard. Un slot null = joueur exempté en face → le joueur
 *   présent est pré-placé directement au round 2 (draw.ts ne crée pas le
 *   match de round 1 correspondant).
 *
 * Fonctions PURES (pas d'accès DB) → testables unitairement.
 */

export interface SeededPlayer {
  playerId: string
  badge: number
}

/** Un slot du bracket : joueur ou bye (null). */
export type BracketSlot = SeededPlayer | null

/** Plus petite puissance de 2 >= n (n >= 1). */
export function nextPowerOfTwo(n: number): number {
  let size = 1
  while (size < n) size *= 2
  return size
}

/** Nombre de rounds d'un bracket de taille donnée (puissance de 2). */
export function totalRounds(bracketSize: number): number {
  return Math.log2(bracketSize)
}

/**
 * Mélange Fisher-Yates en place (copie), aléa via node:crypto.
 * Swap via variable temporaire : compatible `noUncheckedIndexedAccess`
 * (i et j sont toujours dans les bornes, assertion non-null légitime).
 */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1) // 0 <= j <= i
    const tmp = arr[i] as T
    arr[i] = arr[j] as T
    arr[j] = tmp
  }
  return arr
}

/**
 * Construit le tableau des slots du round 1 (taille = puissance de 2).
 *
 * Garantie : au plus un bye par paire (slots 2i / 2i+1). Possible car
 * numByes = size - n < size / 2 dès que n > size / 2 (définition de size).
 *
 * Retour : tableau de `bracketSize` slots ; la paire du match k (1-indexé)
 * est (slots[2k-2], slots[2k-1]).
 */
export function seedPlayers(players: readonly SeededPlayer[]): BracketSlot[] {
  const n = players.length
  const size = nextPowerOfTwo(n)
  const matchCount = size / 2
  const byeCount = size - n

  const shuffled = shuffle(players)

  // Matchs (indices 0..matchCount-1) recevant un bye, tirés au hasard.
  const byeMatches = new Set(
    shuffle(Array.from({ length: matchCount }, (_, i) => i)).slice(0, byeCount),
  )

  const slots: BracketSlot[] = []
  let cursor = 0
  for (let m = 0; m < matchCount; m++) {
    if (byeMatches.has(m)) {
      // Joueur seul en slot A, bye en slot B.
      slots.push(shuffled[cursor++] ?? null, null)
    } else {
      slots.push(shuffled[cursor++] ?? null, shuffled[cursor++] ?? null)
    }
  }
  return slots
}

/**
 * Libellé français de la position d'un match dans le bracket.
 * matchesInRound = nombre de matchs du round concerné.
 */
export function bracketPositionLabel(
  matchesInRound: number,
  matchNumber: number,
): string {
  switch (matchesInRound) {
    case 1:
      return 'Finale'
    case 2:
      return `Demi-${matchNumber}`
    case 4:
      return `Quart-${matchNumber}`
    case 8:
      return `Huitieme-${matchNumber}`
    case 16:
      return `Seizieme-${matchNumber}`
    default:
      return `Tour-${matchesInRound * 2}-M${matchNumber}`
  }
}