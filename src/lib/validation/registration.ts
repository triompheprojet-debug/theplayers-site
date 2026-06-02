/**
 * Schémas Zod — inscription au tournoi (M08).
 *
 * Syntaxe Zod v4 (`{ error: ... }`).
 *
 * SÉCURITÉ (anti-falsification) : le `tournament_id` n'est JAMAIS fourni par le
 * client. Il est résolu côté serveur via le tournoi actif. La réservation en
 * ligne n'a donc aucun champ métier — seul un éventuel honeypot anti-bot est
 * accepté côté formulaire. On garde un schéma explicite pour rester cohérent
 * avec les autres Server Actions et faciliter l'extension (M-ultérieurs).
 */
import { z } from 'zod'

/**
 * Entrée de la réservation en ligne.
 * `website` : honeypot anti-bot (doit rester vide). cf. skill anti-abuse.
 */
export const createReservationSchema = z.object({
  website: z
    .string()
    .max(0, { error: 'Requête invalide.' })
    .optional()
    .default(''),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>