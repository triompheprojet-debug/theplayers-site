/**
 * Construit un lien WhatsApp `wa.me` a partir d'un telephone E.164.
 *
 * Module PUR (pas de `server-only`) : peut etre utilise cote serveur comme
 * client pour fabriquer un href. On ne genere jamais une liste publique de
 * numeros : ce lien sert a contacter UN joueur depuis l'espace admin, le
 * telephone provenant de `profiles.phone` (deja normalise E.164).
 *
 * wa.me attend le numero en chiffres uniquement (sans `+` ni separateurs).
 */
export function buildWhatsAppLink(
  phoneE164: string,
  text?: string,
): string | null {
  const digits = phoneE164.replace(/\D/g, '')
  // Garde-fou : un E.164 plausible fait au moins ~8 chiffres.
  if (digits.length < 8) return null

  const base = `https://wa.me/${digits}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}