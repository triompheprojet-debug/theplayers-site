/**
 * Schémas Zod réutilisables — projet THE PLAYERS.
 *
 * Tous les messages d'erreur sont en français (Zod v4 syntaxe).
 *
 * Ces schémas sont consommés par :
 *  - Les Server Actions (validation entrée utilisateur)
 *  - Les formulaires côté client (react-hook-form)
 *  - Les schémas de tournaments.config (M03)
 */
import { z } from 'zod'

import { isValidCongolesePhone, normalizePhone } from '@/lib/format/phone'
import { isValidPseudo } from '@/lib/format/pseudo'

// ---------------------------------------------------------------------------
// Identifiants joueur
// ---------------------------------------------------------------------------

/**
 * Pseudo joueur — règle SQL : ^[A-Za-z0-9_-]{3,30}$
 */
export const pseudoSchema = z
  .string({ error: 'Le pseudo est obligatoire.' })
  .trim()
  .refine(isValidPseudo, {
    error:
      'Pseudo invalide : 3 à 30 caractères, lettres ASCII, chiffres, tirets et underscores uniquement.',
  })

// ---------------------------------------------------------------------------
// Téléphone congolais (E.164)
// ---------------------------------------------------------------------------

/**
 * Numéro congolais mobile (MTN 06 / Airtel 05 ou 04).
 * Accepte plusieurs formats en entrée (06..., 05..., 04..., +24206..., 24206...)
 * et le normalise systématiquement en E.164 (+242XXXXXXXXX, 0 conservé) après
 * validation. Le 0 national congolais est TOUJOURS conservé (spécificité +242).
 */
export const phoneSchema = z
  .string({ error: 'Le numéro de téléphone est obligatoire.' })
  .trim()
  .refine(isValidCongolesePhone, {
    error:
      'Numéro invalide. Format attendu : 06 / 05 / 04 suivi de 7 chiffres (ex. 06 123 45 67).',
  })
  .transform((val) => normalizePhone(val)!)

// ---------------------------------------------------------------------------
// Mot de passe (Supabase Auth — M06)
// ---------------------------------------------------------------------------

/**
 * Mot de passe joueur.
 * Min 8 caractères. Max 72 OCTETS : bcrypt (utilisé par Supabase Auth) tronque
 * silencieusement au-delà de 72 octets — on borne donc à 72 pour éviter qu'un
 * suffixe de mot de passe soit ignoré à la connexion.
 */
export const passwordSchema = z
  .string({ error: 'Le mot de passe est obligatoire.' })
  .min(8, { error: 'Le mot de passe doit contenir au moins 8 caractères.' })
  .max(72, { error: 'Le mot de passe ne peut pas dépasser 72 caractères.' })

// ---------------------------------------------------------------------------
// Montants FCFA
// ---------------------------------------------------------------------------

/**
 * Montant FCFA — entier positif. Pas de centimes (le FCFA ne se divise pas).
 */
export const fcfaSchema = z
  .number({ error: 'Le montant doit être un nombre.' })
  .int({ error: 'Le montant doit être un entier (pas de décimales en FCFA).' })
  .nonnegative({ error: 'Le montant doit être positif ou nul.' })
  .max(100_000_000, { error: 'Montant excessif (> 100 millions FCFA).' })

/**
 * Variante stricte : montant > 0 (pour cash prizes, frais d'inscription).
 */
export const fcfaPositiveSchema = fcfaSchema.refine((val) => val > 0, {
  error: 'Le montant doit être supérieur à zéro.',
})

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/**
 * Date ISO (YYYY-MM-DD ou ISO complet).
 */
export const dateIsoSchema = z
  .string({ error: 'La date est obligatoire.' })
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    error: 'Date invalide.',
  })

/**
 * Date future (pour dates d'événements à venir).
 */
export const futureDateSchema = dateIsoSchema.refine(
  (val) => new Date(val).getTime() > Date.now(),
  { error: 'La date doit être dans le futur.' },
)

/**
 * Plage horaire au format "HH:MM" (24h).
 */
export const timeSchema = z
  .string({ error: 'L\'heure est obligatoire.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    error: 'Format d\'heure invalide. Attendu : HH:MM (24h).',
  })

// ---------------------------------------------------------------------------
// Authentification admin (M02)
// ---------------------------------------------------------------------------

/**
 * Username admin — convention projet : lettres + chiffres + tirets bas, 3-30 chars.
 */
export const adminUsernameSchema = z
  .string({ error: 'Le nom d\'utilisateur est obligatoire.' })
  .trim()
  .regex(/^[a-z0-9_]{3,20}$/, {
    error:
      'Nom d\'utilisateur invalide : 3 à 20 caractères, minuscules, chiffres et underscores uniquement.',
  })

/**
 * PIN admin — exactement 6 chiffres (configurable plus tard via app_config).
 */
export const pinSchema = z
  .string({ error: 'Le code PIN est obligatoire.' })
  .regex(/^\d{6}$/, { error: 'Le code PIN doit comporter exactement 6 chiffres.' })

// ---------------------------------------------------------------------------
// Helpers de parsing
// ---------------------------------------------------------------------------

/**
 * Parse un FormData en objet selon un schéma Zod.
 * Convertit automatiquement les valeurs en types attendus.
 *
 * Usage typique dans une Server Action :
 *   const result = parseFormData(formData, mySchema)
 *   if (!result.success) return actionError(result.error.message)
 */
export function parseFormData<T extends z.ZodTypeAny>(
  formData: FormData,
  schema: T,
) {

  const obj: Record<string, unknown> = {}
  formData.forEach((value, key) => {
    obj[key] = value
  })
  return schema.safeParse(obj)
}