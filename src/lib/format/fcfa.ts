/**
 * Formatage standardisé des montants en FCFA.
 *
 * Convention :
 *  - Séparateur de milliers : espace fine (style français, via Intl.NumberFormat('fr-FR'))
 *  - Espace insécable (\u00A0) entre le nombre et "FCFA" pour éviter les retours à la ligne moches
 *
 * Exemples :
 *   formatFCFA(3500)       → "3 500 FCFA"
 *   formatFCFA(100000)     → "100 000 FCFA"
 *   formatFCFA(3500, true) → "3,5 k FCFA"
 */

const FCFA_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
})

const FCFA_SHORT_FORMATTER = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatFCFA(amount: number, short = false): string {
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0
  const formatted = short
    ? FCFA_SHORT_FORMATTER.format(safeAmount)
    : FCFA_FORMATTER.format(safeAmount)
  return `${formatted}\u00A0FCFA`
}

/**
 * Variante numérique seule, sans suffixe (utile pour inputs).
 */
export function formatNumber(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0
  return FCFA_FORMATTER.format(safeAmount)
}