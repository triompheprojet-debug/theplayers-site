/**
 * Schémas Zod pour la table `tournaments` (M03).
 *
 * Structure de `tournaments.config` (jsonb) miroir exact de la clé app_config
 * `tournament_defaults` seedée en M03.0. Toute clé inconnue est rejetée
 * (.strict() à chaque niveau) — Règle 11 (zéro hardcode → schéma figé).
 *
 * Sous-objets exposés publiquement via `public_tournament_view` :
 *   game, match, rules, registration, prizes, consoles, schedule, location
 * Sous-objet CONFIDENTIEL (Règle 8) :
 *   payment.* (numéros MTN/Airtel, holders)
 *
 * 3 variantes de création :
 *   - offSeasonCreateSchema    (season_id IS NULL, type='off_season')
 *   - seasonTournamentCreateSchema (season_id + tournament_number, type='season')
 *   - grandFinalCreateSchema   (season_id, type='grand_final', pas de number)
 */
import { z } from 'zod'

import {
  dateIsoSchema,
  fcfaPositiveSchema,
  fcfaSchema,
  phoneSchema,
  timeSchema,
} from '@/lib/validation/common'

// ===========================================================================
// 1. SOUS-SCHÉMAS DE `tournaments.config` (jsonb)
// ===========================================================================

// ---------------------------------------------------------------------------
// game — informations sur le jeu
// ---------------------------------------------------------------------------
export const gameConfigSchema = z
  .object({
    name: z
      .string({ error: 'Le nom du jeu est obligatoire.' })
      .trim()
      .min(2, { error: 'Le nom du jeu est trop court.' })
      .max(80, { error: 'Le nom du jeu est trop long.' }),

    platform: z
      .string({ error: 'La plateforme est obligatoire.' })
      .trim()
      .min(2, { error: 'La plateforme est trop courte.' })
      .max(40, { error: 'La plateforme est trop longue.' }),

    difficulty: z
      .string({ error: 'Le niveau de difficulté est obligatoire.' })
      .trim()
      .min(2, { error: 'Le niveau de difficulté est trop court.' })
      .max(40, { error: 'Le niveau de difficulté est trop long.' }),
  })
  .strict()

// ---------------------------------------------------------------------------
// match — durée et format des matchs
// ---------------------------------------------------------------------------
export const matchConfigSchema = z
  .object({
    duration_minutes: z.coerce
      .number({ error: 'La durée d\'un match est obligatoire.' })
      .int({ error: 'La durée doit être un entier.' })
      .positive({ error: 'La durée doit être supérieure à zéro.' })
      .max(120, { error: 'Durée de match improbable (max 120 min).' }),

    half_minutes: z.coerce
      .number({ error: 'La durée d\'une mi-temps est obligatoire.' })
      .int({ error: 'La durée doit être un entier.' })
      .positive({ error: 'La durée doit être supérieure à zéro.' })
      .max(60, { error: 'Mi-temps improbable (max 60 min).' }),

    break_minutes: z.coerce
      .number({ error: 'La durée de pause est obligatoire.' })
      .int({ error: 'La durée doit être un entier.' })
      .nonnegative({ error: 'La pause ne peut être négative.' })
      .max(30, { error: 'Pause improbable (max 30 min).' }),
  })
  .strict()
  .refine(
    (m) => m.duration_minutes === m.half_minutes * 2 + m.break_minutes,
    {
      error:
        'Incohérence : durée totale doit valoir (mi-temps × 2) + pause.',
      path: ['duration_minutes'],
    },
  )

// ---------------------------------------------------------------------------
// rules — règles de discipline
// ---------------------------------------------------------------------------
export const rulesConfigSchema = z
  .object({
    late_minutes: z.coerce
      .number({ error: 'Le délai de retard est obligatoire.' })
      .int({ error: 'Le délai doit être un entier.' })
      .nonnegative({ error: 'Le délai ne peut être négatif.' })
      .max(60, { error: 'Délai de retard improbable.' }),

    claim_minutes: z.coerce
      .number({ error: 'Le délai de réclamation est obligatoire.' })
      .int({ error: 'Le délai doit être un entier.' })
      .nonnegative({ error: 'Le délai ne peut être négatif.' })
      .max(60, { error: 'Délai de réclamation improbable.' }),

    ban_tournaments: z.coerce
      .number({ error: 'Le nombre de tournois de bannissement est obligatoire.' })
      .int({ error: 'Doit être un entier.' })
      .nonnegative({ error: 'Ne peut être négatif.' })
      .max(20, { error: 'Durée de bannissement improbable.' }),
  })
  .strict()

// ---------------------------------------------------------------------------
// registration — frais d'inscription
// ---------------------------------------------------------------------------
export const registrationConfigSchema = z
  .object({
    amount_fcfa: fcfaPositiveSchema,
  })
  .strict()

// ---------------------------------------------------------------------------
// prizes — cagnotte
// ---------------------------------------------------------------------------
export const prizesConfigSchema = z
  .object({
    first_fcfa: fcfaPositiveSchema,
    second_fcfa: fcfaSchema, // peut être 0 si pas de 2e prix
  })
  .strict()
  .refine((p) => p.first_fcfa >= p.second_fcfa, {
    error: 'Le 1er prix doit être supérieur ou égal au 2e prix.',
    path: ['first_fcfa'],
  })

// ---------------------------------------------------------------------------
// consoles — nombre de consoles actives
// ---------------------------------------------------------------------------
export const consolesConfigSchema = z
  .object({
    active_count: z.coerce
      .number({ error: 'Le nombre de consoles est obligatoire.' })
      .int({ error: 'Doit être un entier.' })
      .positive({ error: 'Au moins 1 console active.' })
      .max(50, { error: 'Nombre de consoles improbable (max 50).' }),
  })
  .strict()

// ---------------------------------------------------------------------------
// schedule — horaires d'événement
// ---------------------------------------------------------------------------
export const scheduleConfigSchema = z
  .object({
    saturday_arrival: timeSchema,
    saturday_briefing: timeSchema,
    sunday_arrival: timeSchema,
    ceremony_time: timeSchema,
  })
  .strict()

// ---------------------------------------------------------------------------
// payment — coordonnées Mobile Money (CONFIDENTIEL, Règle 8)
// ---------------------------------------------------------------------------

/**
 * Numéro Mobile Money : soit vide (config brouillon), soit E.164 valide.
 * Lors de la mise en `registrations_open`, une validation supplémentaire
 * côté Server Action vérifie qu'aucun champ n'est vide (M04+).
 */
const optionalPhone = z.union([z.literal(''), phoneSchema])

export const paymentConfigSchema = z
  .object({
    mtn_number: optionalPhone,
    mtn_holder_name: z
      .string()
      .trim()
      .max(100, { error: 'Nom du titulaire MTN trop long.' })
      .or(z.literal('')),

    airtel_number: optionalPhone,
    airtel_holder_name: z
      .string()
      .trim()
      .max(100, { error: 'Nom du titulaire Airtel trop long.' })
      .or(z.literal('')),
  })
  .strict()

// ---------------------------------------------------------------------------
// location — lieu de l'événement
// ---------------------------------------------------------------------------
export const locationConfigSchema = z
  .object({
    address: z
      .string()
      .trim()
      .max(500, { error: 'Adresse trop longue.' })
      .or(z.literal('')),

    maps_url: z
      .string()
      .trim()
      .url({ error: 'URL Google Maps invalide.' })
      .or(z.literal('')),

    city: z
      .string({ error: 'La ville est obligatoire.' })
      .trim()
      .min(2, { error: 'Nom de ville trop court.' })
      .max(80, { error: 'Nom de ville trop long.' }),

    country: z
      .string({ error: 'Le pays est obligatoire.' })
      .trim()
      .min(2, { error: 'Nom de pays trop court.' })
      .max(80, { error: 'Nom de pays trop long.' }),
  })
  .strict()

// ===========================================================================
// 2. SCHÉMA COMPLET DE `tournaments.config`
// ===========================================================================

export const tournamentConfigSchema = z
  .object({
    game: gameConfigSchema,
    match: matchConfigSchema,
    rules: rulesConfigSchema,
    registration: registrationConfigSchema,
    prizes: prizesConfigSchema,
    consoles: consolesConfigSchema,
    schedule: scheduleConfigSchema,
    payment: paymentConfigSchema,
    location: locationConfigSchema,
  })
  .strict()

export type TournamentConfig = z.infer<typeof tournamentConfigSchema>

// ===========================================================================
// 3. SCHÉMAS DE CRÉATION DE TOURNOI
// ===========================================================================

// ---------------------------------------------------------------------------
// Base commune aux 3 types de tournoi
// ---------------------------------------------------------------------------
const tournamentBaseShape = {
  name: z
    .string({ error: 'Le nom du tournoi est obligatoire.' })
    .trim()
    .min(2, { error: 'Le nom doit comporter au moins 2 caractères.' })
    .max(120, { error: 'Le nom est trop long (120 caractères max).' }),

  start_date: dateIsoSchema,
  end_date: dateIsoSchema,

  /**
   * Fenêtre d'inscription — facultative à la création (peut être ouverte
   * manuellement plus tard via l'interrupteur is_registrations_open M04).
   * Format ISO timestamptz complet.
   */
  registration_opens_at: z
    .string()
    .datetime({ error: 'Date d\'ouverture invalide (format ISO 8601 attendu).' })
    .nullable()
    .optional(),

  registration_closes_at: z
    .string()
    .datetime({ error: 'Date de clôture invalide (format ISO 8601 attendu).' })
    .nullable()
    .optional(),

  /**
   * Capacité confidentielle (Règle 1). Jamais exposée publiquement.
   */
  capacity: z.coerce
    .number({ error: 'La capacité est obligatoire.' })
    .int({ error: 'La capacité doit être un entier.' })
    .positive({ error: 'La capacité doit être supérieure à zéro.' })
    .max(1024, { error: 'Capacité improbable (max 1024).' }),

  config: tournamentConfigSchema,
} as const

// ---------------------------------------------------------------------------
// Refinements partagés — extraits en constantes pour DRY
// ---------------------------------------------------------------------------
const datesRefine = {
  check: (d: { start_date: string; end_date: string }) =>
    new Date(d.end_date).getTime() >= new Date(d.start_date).getTime(),
  opts: {
    error: 'La date de fin doit être postérieure ou égale à la date de début.',
    path: ['end_date'],
  } satisfies { error: string; path: string[] },
}

const registrationWindowRefine = {
  check: (d: {
    registration_opens_at?: string | null
    registration_closes_at?: string | null
  }) => {
    if (!d.registration_opens_at || !d.registration_closes_at) return true
    return (
      new Date(d.registration_closes_at).getTime() >=
      new Date(d.registration_opens_at).getTime()
    )
  },
  opts: {
    error: 'La clôture des inscriptions doit être postérieure à leur ouverture.',
    path: ['registration_closes_at'],
  } satisfies { error: string; path: string[] },
}

// ---------------------------------------------------------------------------
// Hors Saison — season_id IS NULL, tournament_type='off_season'
// ---------------------------------------------------------------------------
export const offSeasonCreateSchema = z
  .object(tournamentBaseShape)
  .strict()
  .refine(datesRefine.check, datesRefine.opts)
  .refine(registrationWindowRefine.check, registrationWindowRefine.opts)

export type OffSeasonCreateInput = z.infer<typeof offSeasonCreateSchema>

// ---------------------------------------------------------------------------
// Tournoi en Saison — season_id requis + tournament_number requis
// ---------------------------------------------------------------------------
export const seasonTournamentCreateSchema = z
  .object({
    ...tournamentBaseShape,
    season_id: z
      .string({ error: 'L\'identifiant de saison est obligatoire.' })
      .uuid({ error: 'Identifiant de saison invalide.' }),

    tournament_number: z.coerce
      .number({ error: 'Le numéro du tournoi dans la saison est obligatoire.' })
      .int({ error: 'Le numéro doit être un entier.' })
      .positive({ error: 'Le numéro doit être supérieur à zéro.' })
      .max(52, { error: 'Numéro de tournoi improbable (max 52).' }),
  })
  .strict()
  .refine(datesRefine.check, datesRefine.opts)
  .refine(registrationWindowRefine.check, registrationWindowRefine.opts)

export type SeasonTournamentCreateInput = z.infer<
  typeof seasonTournamentCreateSchema
>

// ---------------------------------------------------------------------------
// Grande Finale — season_id requis, pas de tournament_number
// ---------------------------------------------------------------------------
export const grandFinalCreateSchema = z
  .object({
    ...tournamentBaseShape,
    season_id: z
      .string({ error: 'L\'identifiant de saison est obligatoire.' })
      .uuid({ error: 'Identifiant de saison invalide.' }),
  })
  .strict()
  .refine(datesRefine.check, datesRefine.opts)
  .refine(registrationWindowRefine.check, registrationWindowRefine.opts)

export type GrandFinalCreateInput = z.infer<typeof grandFinalCreateSchema>

// ===========================================================================
// 4. SCHÉMA DE PATCH (édition d'un tournoi existant)
// ===========================================================================

/**
 * Patch partiel — tous les champs facultatifs.
 * `tournament_type` et `season_id` ne sont JAMAIS modifiables (figés à la création).
 * `capacity` modifiable uniquement avant l'ouverture des inscriptions (vérification
 * dans la Server Action correspondante, pas dans Zod).
 */
export const tournamentUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    start_date: dateIsoSchema.optional(),
    end_date: dateIsoSchema.optional(),

    registration_opens_at: z.string().datetime().nullable().optional(),
    registration_closes_at: z.string().datetime().nullable().optional(),

    capacity: z.coerce.number().int().positive().max(1024).optional(),
    config: tournamentConfigSchema.optional(),

    status: z
      .enum(
        [
          'draft',
          'registrations_open',
          'registrations_closed',
          'in_progress',
          'completed',
          'archived',
        ],
        { error: 'Statut de tournoi invalide.' },
      )
      .optional(),

    is_registrations_open: z
      .boolean({ error: 'Doit être un booléen.' })
      .optional(),

    bracket_visibility: z
      .enum(['draft', 'published'], {
        error: 'Visibilité du bracket invalide.',
      })
      .optional(),
  })
  .strict()

export type TournamentUpdateInput = z.infer<typeof tournamentUpdateSchema>