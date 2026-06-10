/**
 * Barème de points par palier atteint — bracket à élimination directe 128 joueurs.
 *
 * Structure du tournoi : 7 tours + match pour la 3ᵉ place
 *   T1 (128→64) → T2 (64→32) → T3 (32→16) → T4 (16→8) → T5 (8→4) → T6 (4→2) → Finale
 *
 * Le palier "round_reached" stocké dans tournament_standings correspond au
 * stade auquel le joueur a été éliminé (ou Champion s'il a tout gagné).
 *
 * Hors Saison : aucun point n'est attribué (Règle 4) — filtré côté code,
 * indépendamment de ce barème.
 */

export const POINTS_TABLE = {
  champion: 100,       // Gagne la finale                       (1/128)
  runner_up: 75,       // Perd la finale                        (1/128)
  third_place: 55,     // Gagne la petite finale                (1/128)
  fourth_place: 40,    // Perd la petite finale                 (1/128)
  quarter_final: 30,   // Éliminé en quarts        (Top 8)      (4/128)
  round_of_16: 20,     // Éliminé en 8ᵉs de finale (Top 16)     (8/128)
  round_of_32: 15,     // Éliminé en 16ᵉs de finale (Top 32)    (16/128)
  round_of_64: 10,     // Éliminé en 32ᵉs de finale (Top 64)    (32/128)
  participation: 5,    // Éliminé au 1ᵉʳ tour      (Top 128)    (64/128)
} as const

export type PointsKey = keyof typeof POINTS_TABLE

/**
 * Libellés affichables (UI uniquement — la valeur source reste POINTS_TABLE).
 */
export const POINTS_LABELS: Record<PointsKey, string> = {
  champion: 'Champion',
  runner_up: 'Finaliste',
  third_place: '3ᵉ place',
  fourth_place: '4ᵉ place',
  quarter_final: 'Quart de finale',
  round_of_16: '8ᵉ de finale',
  round_of_32: '16ᵉ de finale',
  round_of_64: '32ᵉ de finale',
  participation: '1er tour',
} as const

/**
 * Ordre du plus loin atteint au moins loin — utilisé pour trier les standings
 * en cas d'ex-aequo points et pour afficher le palier dans l'UI.
 */
export const POINTS_KEYS_ORDERED: readonly PointsKey[] = [
  'champion',
  'runner_up',
  'third_place',
  'fourth_place',
  'quarter_final',
  'round_of_16',
  'round_of_32',
  'round_of_64',
  'participation',
] as const