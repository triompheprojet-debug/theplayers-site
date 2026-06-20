/**
 * Schémas Zod — Configuration « Réseaux & coordonnées » (M20).
 *
 * Messages d'erreur en français (Zod v4, clé `error`).
 * Aucun `.transform()` / `.coerce` ici : le type d'entrée == type de sortie,
 * ce qui évite le pattern react-hook-form à 3 génériques côté formulaire.
 * La normalisation E.164 des numéros est faite côté Server Action.
 */
import { z } from 'zod'

import { isValidCongolesePhone } from '@/lib/format/phone'

const optionalUrlSchema = z
  .string({ error: 'Lien invalide.' })
  .trim()
  .max(300, { error: 'Lien trop long (max 300 caractères).' })
  .refine((v) => v === '' || /^https?:\/\/.+/i.test(v), {
    error: 'Lien invalide — il doit commencer par http:// ou https://.',
  })

const requiredPhoneSchema = z
  .string({ error: 'Le numéro est obligatoire.' })
  .trim()
  .refine((v) => isValidCongolesePhone(v), {
    error: 'Numéro invalide (06 / 05 / 04 suivi de 7 chiffres).',
  })

const optionalPhoneSchema = z
  .string({ error: 'Numéro invalide.' })
  .trim()
  .refine((v) => v === '' || isValidCongolesePhone(v), {
    error: 'Numéro invalide (06 / 05 / 04 suivi de 7 chiffres).',
  })

export const socialLinksSchema = z.object({
  facebook: optionalUrlSchema,
  instagram: optionalUrlSchema,
  tiktok: optionalUrlSchema,
  whatsapp_public: optionalPhoneSchema,
})

export const contactPhoneSchema = z.object({
  label: z
    .string({ error: 'Le libellé est obligatoire.' })
    .trim()
    .min(2, { error: 'Libellé trop court (min 2 caractères).' })
    .max(40, { error: 'Libellé trop long (max 40 caractères).' }),
  number: requiredPhoneSchema,
  is_whatsapp: z.boolean(),
})

export const eventLocationSchema = z.object({
  address: z.string().trim().max(160, { error: 'Adresse trop longue (max 160).' }),
  maps_url: optionalUrlSchema,
  city: z.string().trim().max(80, { error: 'Ville trop longue (max 80).' }),
  country: z.string().trim().max(80, { error: 'Pays trop long (max 80).' }),
})

export const socialContactSchema = z.object({
  social_links: socialLinksSchema,
  contact_phones: z
    .array(contactPhoneSchema)
    .max(8, { error: 'Maximum 8 numéros de contact.' }),
  event_location: eventLocationSchema,
})

export type SocialContactFormValues = z.infer<typeof socialContactSchema>