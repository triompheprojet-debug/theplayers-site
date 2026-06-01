import 'server-only'

/**
 * Sanitization des entrées utilisateur (M06 — couche 4 anti-abus).
 *
 * Complète la validation Zod : Zod valide la FORME, sanitize nettoie le CONTENU.
 * Les requêtes Supabase utilisent des paramètres liés → l'injection SQL est
 * déjà couverte par le client. Ici on protège l'affichage et on normalise.
 */

// Caractères de contrôle ASCII (sauf tab/newline) + DEL.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

/**
 * Normalise (NFKC), retire les caractères de contrôle, réduit les espaces
 * multiples et trim. À appliquer aux champs texte libres avant stockage.
 */
export function sanitizeText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sanitize un champ affiché publiquement (pseudo, prénom, nom) : nettoyage
 * texte + suppression de tout caractère pouvant introduire du HTML/markup.
 * NB : la validation de format (longueur, charset) reste du ressort de Zod.
 */
export function sanitizeDisplayName(input: string): string {
  return sanitizeText(input).replace(/[<>&"'`]/g, '')
}

/**
 * Indique si une chaîne contient des caractères de contrôle (entrée suspecte).
 */
export function hasControlChars(input: string): boolean {
  return CONTROL_CHARS.test(input)
}