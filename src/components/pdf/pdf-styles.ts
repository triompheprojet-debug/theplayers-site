import 'server-only'

import { StyleSheet } from '@react-pdf/renderer'

import { PDF_FONT } from './pdf-fonts'

/**
 * Styles partagés du PDF officiel (M11). Couleurs = constantes de PRÉSENTATION
 * du document imprimé (pas des valeurs métier — Règle 11 ne s'applique pas).
 * Fond clair (impression), texte sombre, un accent. Aucun emoji.
 */
const COLOR = {
  ink: '#0B1220',
  sub: '#475569',
  line: '#E2E8F0',
  accent: '#1D4ED8',
  bandText: '#FFFFFF',
  muted: '#94A3B8',
}

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: PDF_FONT.regular,
    color: COLOR.ink,
    fontSize: 11,
    lineHeight: 1.4,
  },

  // En-tête
  header: {
    backgroundColor: COLOR.ink,
    color: COLOR.bandText,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginBottom: 20,
  },
  headerTitle: { fontFamily: PDF_FONT.bold, fontSize: 16, color: COLOR.bandText },
  headerSub: { fontSize: 9, color: COLOR.muted, marginTop: 3 },

  // Sections
  sectionTitle: {
    fontFamily: PDF_FONT.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: COLOR.accent,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 1,
    borderColor: COLOR.line,
    borderRadius: 6,
    padding: 16,
    marginBottom: 18,
  },

  // Lignes label / valeur
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 150, color: COLOR.sub, fontSize: 10 },
  value: { flex: 1, fontFamily: PDF_FONT.bold, fontSize: 11 },

  // Badge + QR
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badgeInfo: { flex: 1 },
  badgeNumberLabel: { color: COLOR.sub, fontSize: 10 },
  badgeNumber: { fontFamily: PDF_FONT.bold, fontSize: 40, color: COLOR.ink },
  badgePseudo: { fontFamily: PDF_FONT.bold, fontSize: 16, marginTop: 4 },
  qrBox: { width: 130, height: 130, marginLeft: 16 },
  qrImage: { width: 130, height: 130 },
  qrCaption: { fontSize: 7, color: COLOR.muted, textAlign: 'center', marginTop: 4 },

  // Pied
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLOR.line,
    paddingTop: 8,
    fontSize: 8,
    color: COLOR.muted,
  },
})