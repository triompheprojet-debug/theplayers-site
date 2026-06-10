/**
 * Génération et validation de slugs URL-safe.
 *
 * Cas d'usage :
 *  - URLs de tournois historiques : /historique/the-players-juin-2026
 *  - URLs d'éditions saison : /editions/saison-2026-2027
 *  - Tout identifiant lisible dans une URL
 *
 * Règles :
 *  - Minuscules uniquement
 *  - Lettres ASCII + chiffres + tirets uniquement
 *  - Pas de tirets consécutifs ni en début/fin
 *  - Limite 80 caractères (URL-friendly)
 */

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_SLUG_LENGTH = 80

/**
 * Transforme un texte libre en slug URL-safe.
 *
 * Exemples :
 *   slugify("THE PLAYERS Juin 2026")           → "the-players-juin-2026"
 *   slugify("Édition été — Côte sauvage !")    → "edition-ete-cote-sauvage"
 *   slugify("  Multiple   espaces  ")          → "multiple-espaces"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')                       // décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '')        // retire les diacritiques (é → e)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')          // remplace les caractères spéciaux par espaces
    .trim()
    .replace(/[\s-]+/g, '-')                // collapse espaces et tirets en un seul tiret
    .replace(/^-+|-+$/g, '')                // retire les tirets en début/fin
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')                    // retire un éventuel tiret final après le slice
}

/**
 * Vérifie qu'un slug est valide selon la convention du projet.
 */
export function isValidSlug(slug: string): boolean {
  if (slug.length === 0 || slug.length > MAX_SLUG_LENGTH) return false
  return SLUG_REGEX.test(slug)
}

/**
 * Génère un slug avec suffixe numérique en cas de collision.
 * Exemple : slugify("Tournoi été") + check DB → "tournoi-ete" puis "tournoi-ete-2", etc.
 *
 * @param base       Texte source du slug
 * @param existsCheck Fonction async qui retourne true si le slug existe déjà
 * @param maxTries   Nombre max d'essais. Défaut : 100
 */
export async function uniqueSlug(
  base: string,
  existsCheck: (slug: string) => Promise<boolean>,
  maxTries = 100,
): Promise<string> {
  const baseSlug = slugify(base)
  if (!baseSlug) throw new Error('Slug vide après normalisation : texte source invalide.')

  // Tentative directe
  if (!(await existsCheck(baseSlug))) return baseSlug

  // Suffixes incrémentaux
  for (let i = 2; i <= maxTries; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!(await existsCheck(candidate))) return candidate
  }

  throw new Error(`Impossible de générer un slug unique après ${maxTries} tentatives.`)
}