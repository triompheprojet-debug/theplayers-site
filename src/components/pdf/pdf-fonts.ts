import 'server-only'

/**
 * Enregistrement des polices PDF (M11).
 *
 * On reste sur les polices INTÉGRÉES de @react-pdf/renderer (aucune ressource
 * externe, aucun fetch réseau au rendu → robuste sur Vercel) :
 *   - Helvetica / Helvetica-Bold : titres et valeurs (sans-serif)
 *   - Courier / Courier-Bold     : libellés monospace (style « machine » des
 *                                  étiquettes du reçu, fidèle à la maquette)
 *
 * Point d'extension : pour une police de marque, importer `Font` et appeler
 * `Font.register` avec des TTF empaquetés dans le repo (jamais une URL distante
 * au rendu serveur).
 */
export const PDF_FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  mono: 'Courier',
  monoBold: 'Courier-Bold',
} as const

let registered = false

/** Idempotent. No-op tant qu'on reste sur les polices intégrées. */
export function registerPdfFonts(): void {
  if (registered) return
  // import { Font } from '@react-pdf/renderer'
  // Font.register({ family: 'Marque', fonts: [{ src: '<chemin TTF empaqueté>' }] })
  registered = true
}