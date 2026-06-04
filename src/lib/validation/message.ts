import { z } from 'zod'

/**
 * Schemas de validation de la messagerie (M12) — Zod v4.
 *
 * Cote Server Action, utiliser `z.flattenError(err).fieldErrors` puis caster en
 * `Record<string, string[] | undefined>` avant iteration (piege Zod v4,
 * cf. MISE_A_JOUR §6ter.4) si un `.refine` objet est ajoute plus tard.
 */

const subjectSchema = z
  .string()
  .trim()
  .min(1, 'Le sujet est requis')
  .max(150, 'Sujet trop long (150 caracteres maximum)')

const bodySchema = z
  .string()
  .trim()
  .min(1, 'Le message est requis')
  .max(4000, 'Message trop long (4000 caracteres maximum)')

/** Envoi unitaire admin -> un joueur. */
export const sendMessageSchema = z.object({
  recipientPlayerId: z.string().uuid('Destinataire invalide'),
  subject: subjectSchema,
  body: bodySchema,
  allowReplies: z.boolean().default(false),
  /** Cle de template appliquee cote UI (informatif, non persiste). */
  templateKey: z.string().trim().min(1).optional(),
})
export type SendMessageInput = z.infer<typeof sendMessageSchema>

/** Broadcast admin -> joueurs du tournoi actif selon le scope. */
export const broadcastSchema = z.object({
  scope: z.enum(['all_confirmed', 'all_registered']),
  subject: subjectSchema,
  body: bodySchema,
  allowReplies: z.boolean().default(false),
  templateKey: z.string().trim().min(1).optional(),
})
export type BroadcastInput = z.infer<typeof broadcastSchema>

/** Reponse joueur -> admin (autorisee seulement si le parent l'autorise). */
export const replySchema = z.object({
  parentMessageId: z.string().uuid('Message invalide'),
  body: bodySchema,
})
export type ReplyInput = z.infer<typeof replySchema>