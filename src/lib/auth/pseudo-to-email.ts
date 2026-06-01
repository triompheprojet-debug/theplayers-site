import 'server-only'

/**
 * Conversion pseudo → email synthétique pour Supabase Auth (M06).
 *
 * Les joueurs s'authentifient par pseudo (Règle 2), mais Supabase Auth exige
 * un email. On fabrique un email synthétique déterministe à partir du pseudo,
 * sur un domaine réservé qui ne reçoit jamais de courrier.
 *
 * - Inscription : pseudoToEmail(pseudo) → stocké comme email du compte auth.users
 * - Connexion   : on reconvertit le pseudo saisi avant signInWithPassword
 *
 * Le pseudo (casse d'origine) est conservé dans profiles.pseudo. L'email
 * synthétique est toujours en minuscules → cohérent avec l'unicité
 * case-insensitive de l'index idx_profiles_pseudo_lower.
 */

/** Domaine réservé. Aucun email n'est jamais délivré à ce domaine. */
export const SYNTHETIC_EMAIL_DOMAIN = 'theplayers.local'

/**
 * Convertit un pseudo en email synthétique `pseudo@theplayers.local` (minuscule).
 * Le pseudo est supposé déjà validé (pseudoSchema) en amont.
 */
export function pseudoToEmail(pseudo: string): string {
  return `${pseudo.trim().toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`
}