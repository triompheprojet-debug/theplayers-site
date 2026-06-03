import 'server-only'

/**
 * Enregistrement des polices PDF (M11).
 *
 * Par défaut on utilise les polices intégrées de @react-pdf/renderer
 * (Helvetica / Helvetica-Bold) : aucune ressource externe, aucun fetch réseau
 * au rendu (robuste sur Vercel). Point d'extension : pour une police de marque,
 * importer Font et appeler Font.register avec des TTF empaquetés dans le repo
 * (jamais une URL distante au rendu serveur).
 */
export const PDF_FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
} as const

let registered = false

/** Idempotent. No-op tant qu'on reste sur les polices intégrées. */
export function registerPdfFonts(): void {
  if (registered) return
  // import { Font } from '@react-pdf/renderer'
  // Font.register({ family: 'Marque', fonts: [{ src: '<chemin TTF empaqueté>' }] })
  registered = true
}