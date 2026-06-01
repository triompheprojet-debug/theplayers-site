/**
 * Schémas Zod pour la gestion du profil joueur.
 *
 * Créé en M06 (cf. guide §11.3) ; consommé pleinement en M07 (page profil).
 * Le pseudo n'est PAS modifiable côté joueur (immuable, protégé en DB par le
 * trigger protect_profile_columns) → il n'apparaît pas dans ce schéma.
 *
 * Syntaxe Zod v4 (`{ error: ... }`).
 */
import { z } from 'zod'

import { passwordSchema, phoneSchema } from './common'

// ---------------------------------------------------------------------------
// Mise à jour des informations personnelles
// ---------------------------------------------------------------------------

export const profileUpdateSchema = z.object({
  firstName: z
    .string({ error: 'Le prénom est obligatoire.' })
    .trim()
    .min(1, { error: 'Le prénom est obligatoire.' })
    .max(50, { error: 'Le prénom ne peut pas dépasser 50 caractères.' }),
  lastName: z
    .string({ error: 'Le nom est obligatoire.' })
    .trim()
    .min(1, { error: 'Le nom est obligatoire.' })
    .max(50, { error: 'Le nom ne peut pas dépasser 50 caractères.' }),
  phone: phoneSchema,
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

// ---------------------------------------------------------------------------
// Changement de mot de passe
// ---------------------------------------------------------------------------

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string({ error: 'Le mot de passe actuel est obligatoire.' })
      .min(1, { error: 'Le mot de passe actuel est obligatoire.' }),
    newPassword: passwordSchema,
    confirmPassword: z.string({ error: 'Veuillez confirmer le mot de passe.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>