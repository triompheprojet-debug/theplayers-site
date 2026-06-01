/**
 * Schémas Zod pour l'authentification (admin M02 + joueur M06).
 *
 * Réutilise les schémas de base définis dans `common.ts`.
 * Syntaxe Zod v4 (`{ error: ... }`).
 */
import { z } from 'zod'

import {
  adminUsernameSchema,
  passwordSchema,
  phoneSchema,
  pinSchema,
  pseudoSchema,
} from './common'

// ---------------------------------------------------------------------------
// Admin (M02)
// ---------------------------------------------------------------------------

export const adminLoginSchema = z.object({
  username: adminUsernameSchema,
  pin: pinSchema,
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>

// ---------------------------------------------------------------------------
// Inscription joueur (M06)
// ---------------------------------------------------------------------------

/**
 * Inscription joueur.
 *
 * - `phone` est normalisé en E.164 par phoneSchema (transform) : l'entrée et la
 *   sortie restent des `string` → aucun conflit RHF (pas de z.coerce ici).
 * - `acceptRules` : exprimé en booléen (checkbox RHF) plutôt qu'en z.literal,
 *   plus fiable pour le message d'erreur en Zod v4.
 * - `turnstileToken` : présence obligatoire ; la VALIDITÉ est vérifiée côté
 *   serveur (verifyTurnstile), jamais ici.
 * - Le honeypot (`company_website`) n'est PAS dans ce schéma : il est lu sur le
 *   payload brut AVANT parsing, puis traité en réponse leurre.
 */
export const signUpSchema = z
  .object({
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
    pseudo: pseudoSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string({ error: 'Veuillez confirmer le mot de passe.' }),
    acceptRules: z.boolean().refine((v) => v === true, {
      error: 'Vous devez accepter le règlement pour créer un compte.',
    }),
    turnstileToken: z
      .string({ error: 'Vérification anti-robot requise.' })
      .min(1, { error: 'Vérification anti-robot requise.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })

export type SignUpInput = z.infer<typeof signUpSchema>

// ---------------------------------------------------------------------------
// Connexion joueur (M06)
// ---------------------------------------------------------------------------

/**
 * Connexion joueur par pseudo + mot de passe.
 * Le mot de passe n'est PAS re-validé sur sa complexité (juste non vide) : la
 * connexion ne doit pas révéler les règles ni l'existence d'un compte.
 */
export const signInSchema = z.object({
  pseudo: pseudoSchema,
  password: z
    .string({ error: 'Le mot de passe est obligatoire.' })
    .min(1, { error: 'Le mot de passe est obligatoire.' }),
})

export type SignInInput = z.infer<typeof signInSchema>