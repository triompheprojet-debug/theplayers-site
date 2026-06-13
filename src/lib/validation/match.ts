/**
 * Schémas Zod — saisie de score d'un match (M14, réutilisé M15).
 *
 * Syntaxe Zod v4 (`{ error: ... }`). Pattern à 3 génériques côté RHF requis
 * partout où un `.transform` est présent (ici via z.coerce.number()).
 *
 * Deux modes, distingués par la présence de `forfeitPlayerId` :
 *   - Score normal : scoreA / scoreB entiers >= 0, ÉGALITÉ INTERDITE
 *     (élimination directe → un vainqueur obligatoire).
 *   - Forfait : forfeitPlayerId (uuid) du joueur déclarant forfait ; scores
 *     facultatifs ; raison facultative.
 *
 * La vérification « forfeitPlayerId appartient bien au match » est faite côté
 * serveur (submit-score.ts) car elle nécessite l'état du match.
 */
import { z } from 'zod'

const scoreField = z.coerce
  .number({ error: 'Le score doit être un nombre.' })
  .int({ error: 'Le score doit être un entier.' })
  .min(0, { error: 'Le score ne peut pas être négatif.' })
  .max(99, { error: 'Score invalide (maximum 99).' })

export const matchScoreSchema = z
  .object({
    matchId: z
      .string({ error: 'Match manquant.' })
      .uuid({ error: 'Match invalide.' }),
    scoreA: scoreField,
    scoreB: scoreField,
  })
  .refine((d) => d.scoreA !== d.scoreB, {
    error: 'Match nul impossible en élimination directe : il faut un vainqueur.',
    path: ['scoreB'],
  })

export type MatchScoreInput = z.input<typeof matchScoreSchema>
export type MatchScoreOutput = z.output<typeof matchScoreSchema>

export const matchForfeitSchema = z.object({
  matchId: z
    .string({ error: 'Match manquant.' })
    .uuid({ error: 'Match invalide.' }),
  forfeitPlayerId: z
    .string({ error: 'Joueur déclarant forfait manquant.' })
    .uuid({ error: 'Joueur invalide.' }),
  forfeitReason: z
    .string()
    .trim()
    .max(200, { error: 'Motif trop long (200 caractères max).' })
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
})

export type MatchForfeitInput = z.input<typeof matchForfeitSchema>
export type MatchForfeitOutput = z.output<typeof matchForfeitSchema>