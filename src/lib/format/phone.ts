/**
 * Formatage, normalisation et détection d'opérateur des numéros congolais (+242).
 *
 * MODÈLE DE DONNÉES — un seul numéro canonique stocké, deux affichages dérivés.
 *
 * Spécificité Congo-Brazzaville : PAS de préfixe interurbain. Le 0 national est
 * conservé à l'international (≠ RDC +243). Tout numéro = 9 chiffres après +242.
 *
 *   Canonique stocké (E.164)      → "+2420XXXXXXXX"   (+242 + 9 chiffres, 0 inclus)
 *   Affichage international/WhatsApp → "+242 06 XXX XX XX"
 *   Affichage local (saisie/copie/paiement) → "06 XXX XX XX"
 *
 * Opérateurs (2e chiffre du national) :
 *   06 → MTN        |   05 ou 04 → Airtel
 */

const CONGO_COUNTRY_CODE = '+242'

/** Opérateurs mobiles reconnus. */
export type PhoneOperator = 'mtn' | 'airtel'

/**
 * Réduit n'importe quelle saisie au national congolais à 9 chiffres
 * ("0" + 8 chiffres), ou null si non reconnaissable.
 * Accepte : "06 00 00 00 00", "+242 06 ...", "242 06 ...", "0600000000".
 */
function toNational(input: string): string | null {
  if (!input) return null
  let digits = input.replace(/[^\d+]/g, '')

  // Retire l'indicatif sous ses formes possibles (+242 / 242), 0 conservé.
  if (digits.startsWith('+242')) digits = digits.slice(4)
  else if (digits.startsWith('242')) digits = digits.slice(3)

  // National congolais valide : 9 chiffres commençant par 0.
  return /^0\d{8}$/.test(digits) ? digits : null
}

/**
 * Opérateur d'après le préfixe national : 06 → MTN, 05/04 → Airtel.
 * Renvoie null si le préfixe n'est pas reconnu (ou numéro invalide).
 */
export function getPhoneOperator(input: string): PhoneOperator | null {
  const national = toNational(input)
  if (!national) return null
  const prefix = national.slice(0, 2)
  if (prefix === '06') return 'mtn'
  if (prefix === '05' || prefix === '04') return 'airtel'
  return null
}

/**
 * Numéro valide = national reconnu ET opérateur connu (06 / 05 / 04).
 * NB : on rejette tout préfixe hors 06/05/04 (cf. règles projet MTN/Airtel).
 */
export function isValidCongolesePhone(input: string): boolean {
  return getPhoneOperator(input) !== null
}

/**
 * Normalise vers le canonique E.164 congolais (0 conservé) : "+2420XXXXXXXX".
 * Retourne null si le numéro n'est pas un mobile MTN/Airtel valide.
 */
export function normalizePhone(input: string): string | null {
  const national = toNational(input)
  if (!national || getPhoneOperator(national) === null) return null
  return `${CONGO_COUNTRY_CODE}${national}`
}

/**
 * Affichage LOCAL — le format du quotidien : "06 XXX XX XX".
 * Utilisé pour la saisie, l'affichage et la COPIE (inscription, paiement).
 * Accepte aussi bien le canonique que n'importe quelle saisie valide.
 */
export function formatPhoneLocal(value: string): string {
  const national = toNational(value)
  if (!national) return value
  // Groupes 2-3-2-2 : "06 123 45 67"
  return `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5, 7)} ${national.slice(7, 9)}`
}

/**
 * Affichage INTERNATIONAL — format WhatsApp : "+242 06 XXX XX XX".
 */
export function formatPhoneInternational(value: string): string {
  const national = toNational(value)
  if (!national) return value
  return `${CONGO_COUNTRY_CODE} ${formatPhoneLocal(national)}`
}

/**
 * Alias rétro-compatible : l'ancien `formatPhone` affichait l'international.
 * Conservé pour ne pas casser les appelants existants (affichages admin, etc.).
 */
export const formatPhone = formatPhoneInternational

/**
 * Chiffres prêts pour wa.me : "2420XXXXXXXX" (indicatif + national, 0 conservé,
 * sans "+" ni séparateur). Renvoie null si le numéro est invalide.
 */
export function phoneToWhatsApp(value: string): string | null {
  const national = toNational(value)
  if (!national) return null
  return `242${national}`
}