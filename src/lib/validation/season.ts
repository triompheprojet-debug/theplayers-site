/**
 * Schémas Zod pour la table `seasons` (M03).
 *
 * Reflète strictement les contraintes SQL (03_create_seasons.sql) :
 *   - name : trim, length >= 2
 *   - season_number : int unique > 0
 *   - start_date / end_date : date ISO, end >= start
 *   - expected_tournaments : int > 0
 *   - qualification_threshold : int > 0
 *
 * NB : `status`, `created_by`, `updated_by`, `is_deleted` sont gérés
 * côté Server Action (forcés à 'active' / session.adminId / false).
 */
import { z } from 'zod'

import { dateIsoSchema } from '@/lib/validation/common'

// ---------------------------------------------------------------------------
// Schéma de création d'une saison
// ---------------------------------------------------------------------------

export const seasonCreateSchema = z
  .object({
    name: z
      .string({ error: 'Le nom de la saison est obligatoire.' })
      .trim()
      .min(2, { error: 'Le nom doit comporter au moins 2 caractères.' })
      .max(100, { error: 'Le nom est trop long (100 caractères max).' }),

    season_number: z.coerce
      .number({ error: 'Le numéro de saison est obligatoire.' })
      .int({ error: 'Le numéro de saison doit être un entier.' })
      .positive({ error: 'Le numéro de saison doit être supérieur à zéro.' })
      .max(999, { error: 'Numéro de saison improbable (max 999).' }),

    description: z
      .string()
      .trim()
      .max(2000, { error: 'La description est trop longue (2000 caractères max).' })
      .optional()
      .or(z.literal('')),

    start_date: dateIsoSchema,
    end_date: dateIsoSchema,

    expected_tournaments: z.coerce
      .number({ error: 'Le nombre de tournois attendus est obligatoire.' })
      .int({ error: 'Le nombre de tournois doit être un entier.' })
      .positive({ error: 'Le nombre de tournois doit être supérieur à zéro.' })
      .max(52, { error: 'Trop de tournois prévus (max 52 par saison).' }),

    qualification_threshold: z.coerce
      .number({ error: 'Le seuil de qualification est obligatoire.' })
      .int({ error: 'Le seuil doit être un entier.' })
      .positive({ error: 'Le seuil doit être supérieur à zéro.' })
      .max(100_000, { error: 'Seuil de qualification improbable.' }),
  })
  .strict()
  .refine(
    (data) =>
      new Date(data.end_date).getTime() >= new Date(data.start_date).getTime(),
    {
      error: 'La date de fin doit être postérieure ou égale à la date de début.',
      path: ['end_date'],
    },
  )

export type SeasonCreateInput = z.infer<typeof seasonCreateSchema>

// ---------------------------------------------------------------------------
// Schéma d'édition d'une saison
// ---------------------------------------------------------------------------

/**
 * Variante édition : tous les champs optionnels (PATCH partiel).
 * Le numéro de saison reste figé après création (UNIQUE en DB).
 */
export const seasonUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: 'Le nom doit comporter au moins 2 caractères.' })
      .max(100, { error: 'Le nom est trop long (100 caractères max).' })
      .optional(),

    description: z.string().trim().max(2000).optional().or(z.literal('')),

    start_date: dateIsoSchema.optional(),
    end_date: dateIsoSchema.optional(),

    expected_tournaments: z.coerce.number().int().positive().max(52).optional(),
    qualification_threshold: z.coerce.number().int().positive().max(100_000).optional(),

    status: z
      .enum(['active', 'completed', 'archived'], {
        error: 'Statut de saison invalide.',
      })
      .optional(),
  })
  .strict()

export type SeasonUpdateInput = z.infer<typeof seasonUpdateSchema>