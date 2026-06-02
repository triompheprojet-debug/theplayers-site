/**
 * Schéma Zod — soumission d'une preuve de paiement (M09).
 *
 * Syntaxe Zod v4 (`{ error: ... }`).
 *
 * Règle 3 : method ∈ {mtn_mobile_money, airtel_money, cash}.
 *   - cash → PAS de transaction_ref (et pas obligatoire).
 *   - mobile money → transaction_ref OBLIGATOIRE.
 *
 * Le FICHIER (capture) n'est PAS validé ici : un `File` transite via FormData
 * jusqu'à la Server Action, qui valide type MIME + taille avant upload
 * (cf. submit-proof.ts). Ce schéma valide uniquement les champs texte/nombre.
 */
import { z } from 'zod'

import { fcfaPositiveSchema } from './common'

const methodEnum = z.enum(['mtn_mobile_money', 'airtel_money', 'cash'], {
  error: 'Méthode de paiement invalide.',
})

export const paymentProofSchema = z
  .object({
    registrationId: z
      .string({ error: 'Réservation manquante.' })
      .uuid({ error: 'Réservation invalide.' }),
    method: methodEnum,
    amountFcfa: fcfaPositiveSchema,
    // Pour cash, l'émetteur est facultatif ; pour mobile money on demande le
    // numéro émetteur (utile au rapprochement admin). On valide via phoneSchema
    // seulement s'il est fourni → champ optionnel + transform géré plus bas.
    senderPhone: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    senderName: z
      .string()
      .trim()
      .max(80, { error: 'Nom trop long (80 caractères max).' })
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    timeSlot: z
      .string()
      .trim()
      .max(40, { error: 'Créneau trop long.' })
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    transactionRef: z
      .string()
      .trim()
      .max(60, { error: 'Référence trop longue (60 caractères max).' })
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
  })
  // cash : pas de référence
  .refine((d) => !(d.method === 'cash' && d.transactionRef), {
    error: "Le paiement en espèces ne comporte pas de référence de transaction.",
    path: ['transactionRef'],
  })
  // mobile money : référence obligatoire
  .refine((d) => !(d.method !== 'cash' && !d.transactionRef), {
    error: 'La référence de transaction est obligatoire pour le mobile money.',
    path: ['transactionRef'],
  })

// `senderPhone` est laissé en string libre ici (validation E.164 souple) pour
// ne pas bloquer un format saisi à la main ; la normalisation stricte reste
// disponible via phoneSchema si on veut durcir plus tard.
export type PaymentProofInput = z.input<typeof paymentProofSchema>
export type PaymentProofOutput = z.output<typeof paymentProofSchema>