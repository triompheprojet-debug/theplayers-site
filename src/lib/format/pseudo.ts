/**
 * Normalisation et validation des pseudos joueur.
 *
 * Règle SQL (profiles.pseudo) : ^[A-Za-z0-9_-]{3,30}$
 *  - 3 à 30 caractères
 *  - Lettres ASCII, chiffres, "_" et "-" uniquement
 *
 * L'unicité est garantie au niveau DB via UNIQUE + index LOWER(pseudo).
 */

const PSEUDO_REGEX = /^[A-Za-z0-9_-]{3,30}$/

/**
 * Nettoie un input utilisateur :
 *  - Retire espaces en début/fin
 *  - Conserve la casse originale (display)
 *  - NE valide PAS le format (utiliser isValidPseudo séparément)
 */
export function normalizePseudo(input: string): string {
  return input.trim()
}

/**
 * Vérifie le format selon la règle SQL.
 */
export function isValidPseudo(input: string): boolean {
  return PSEUDO_REGEX.test(input)
}

/**
 * Pour comparaison case-insensitive côté code
 * (l'unicité DB utilise LOWER(pseudo)).
 */
export function pseudoToCompareKey(pseudo: string): string {
  return pseudo.toLowerCase()
}