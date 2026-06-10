import 'server-only'

import { StyleSheet } from '@react-pdf/renderer'

import { PDF_FONT as F } from './pdf-fonts'

/**
 * Palette + styles du PDF officiel (M11), repris à l'identique de la maquette
 * HTML fournie (variables :root). Conversion px → pt : ×0.75 (96dpi → 72pt).
 * `letterSpacing` est en POINTS dans react-pdf (= em × taille en pt).
 * Couleurs = présentation imprimée (la Règle 11 ne s'applique pas). Aucun emoji.
 */
export const PDF_COLOR = {
  paper: '#ffffff',
  backdrop: '#e7e6ee',
  ink: '#14141f',
  ink2: '#54546a',
  ink3: '#8c8c9e',
  hair: 'rgba(20,20,31,0.10)',
  hairSoft: 'rgba(20,20,31,0.06)',
  panel: '#f6f5fb',
  panel2: '#efeef7',
  violet: '#7c3aed',
  violetBright: '#8b5cf6',
  violetDim: '#6d28d9',
  violetTint: '#f2ecfe',
  violetTint2: '#e7dcfd',
  green: '#0f9d58',
  greenDeep: '#0a7d44',
  greenNeon: '#22c55e',
  greenTint: '#e7f8ee',
  warning: '#c2740a',
  warningTint: '#fdf3e3',
  warningBorder: 'rgba(194,116,10,0.28)',
  danger: '#dc2626',
  crit: '#a32424',
  mtn: '#FFCB05',
  airtel: '#ED1B24',
  dark: '#0a0a14',
  dark2: '#14141f',
  dark3: '#1f1f2e',
  white: '#ffffff',
  headerText: '#f4f4f5',
  headerMuted: '#9d9db5',
  headerFaint: '#86869c',
} as const

export const BODY_PAD = 22.5 // 30px

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    fontFamily: F.regular,
    color: PDF_COLOR.ink,
    fontSize: 9.75,
    lineHeight: 1.35,
    backgroundColor: PDF_COLOR.paper,
  },
  body: { paddingTop: 16, paddingHorizontal: BODY_PAD },

  // ---------- En-tête ----------
  header: {
    position: 'relative',
    width: '100%',
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: BODY_PAD,
    overflow: 'hidden',
  },
  hTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandLogo: { width: 46, height: 46, borderRadius: 12, marginRight: 12 },
  brandName: { fontFamily: F.bold, fontSize: 19.5, color: PDF_COLOR.headerText, letterSpacing: 0.78, lineHeight: 1 },
  brandSub: { fontSize: 8.25, color: PDF_COLOR.violetBright, letterSpacing: 2.1, marginTop: 2, fontFamily: F.bold },
  docKind: { fontSize: 7.5, color: PDF_COLOR.headerMuted, letterSpacing: 1.2, marginTop: 7 },

  hRight: { alignItems: 'flex-end' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 999,
    borderWidth: 1, borderColor: '#2c9e63',
    paddingHorizontal: 9, paddingVertical: 4,
  },
  chipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22ff88', marginRight: 5 },
  chipText: { fontFamily: F.bold, fontSize: 7.9, color: '#22ff88', letterSpacing: 0.9 },
  genDate: { fontSize: 7.5, color: PDF_COLOR.headerMuted, marginTop: 6 },
  genDateB: { fontFamily: F.bold, color: PDF_COLOR.headerText },
  receiptRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  receiptLbl: { fontSize: 7.5, color: PDF_COLOR.headerMuted, letterSpacing: 0.3 },
  receiptVal: { fontFamily: F.monoBold, fontSize: 9.75, color: PDF_COLOR.headerText, letterSpacing: 0.4 },

  hBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  serviceLbl: { fontSize: 7.2, color: PDF_COLOR.headerMuted },
  serviceVal: { fontFamily: F.bold, fontSize: 9.75, color: PDF_COLOR.headerText, marginTop: 2 },
  hBadges: { flexDirection: 'row', alignItems: 'stretch' },
  qrCard: { backgroundColor: '#fff', borderRadius: 9, padding: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  qrCardImg: { width: 46, height: 46 },
  qrCardCap: { fontFamily: F.mono, fontSize: 5.2, color: '#54546a', letterSpacing: 0.4, marginTop: 2 },
  pnBox: { position: 'relative', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9, minWidth: 80, justifyContent: 'center', overflow: 'hidden' },
  pnLabel: { fontFamily: F.mono, fontSize: 6.4, color: 'rgba(255,255,255,0.82)', letterSpacing: 1.15 },
  pnNum: { fontFamily: F.bold, fontSize: 34.5, color: '#fff', lineHeight: 0.96, marginTop: 2 },

  accent: { width: '100%', height: 4 },

  // ---------- Section A/B tag ----------
  sectionTag: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 14 },
  pill: { backgroundColor: PDF_COLOR.ink, borderRadius: 4.5, paddingHorizontal: 6.75, paddingVertical: 3, marginRight: 9 },
  pillB: { backgroundColor: PDF_COLOR.violet },
  pillText: { fontFamily: F.bold, fontSize: 7.5, color: '#fff', letterSpacing: 0.6 },
  tagTitle: { fontFamily: F.bold, fontSize: 9, color: PDF_COLOR.ink2, letterSpacing: 1.44 },
  tagLine: { flex: 1, height: 1, backgroundColor: PDF_COLOR.hair, marginLeft: 10 },

  // ---------- Block head ----------
  blockHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 2 },
  blockMark: { width: 6.75, height: 6.75, marginRight: 8 },
  blockH2: { fontFamily: F.bold, fontSize: 9.75, color: PDF_COLOR.ink, letterSpacing: 0.585 },
  blockRule: { flex: 1, height: 1, backgroundColor: PDF_COLOR.hairSoft, marginLeft: 9 },

  // ---------- Grille / cellules ----------
  grid: { borderRadius: 7.5, overflow: 'hidden', marginBottom: 11, backgroundColor: PDF_COLOR.paper },
  row: { flexDirection: 'row' },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#e6e6ec' },
  cell: { paddingHorizontal: 9.75, paddingVertical: 8.25, justifyContent: 'center' },
  cellDivider: { borderRightWidth: 1, borderRightColor: '#e6e6ec' },
  cellLabel: { fontFamily: F.mono, fontSize: 6.2, color: PDF_COLOR.ink3, letterSpacing: 0.55 },
  cellValue: { fontFamily: F.bold, fontSize: 9.75, color: PDF_COLOR.ink, marginTop: 3 },
  cellValueMono: { fontFamily: F.monoBold, fontSize: 9.25, color: PDF_COLOR.ink, marginTop: 3, letterSpacing: 0.1 },

  pseudoCell: { backgroundColor: PDF_COLOR.violetTint, position: 'relative' },
  pseudoLbl: { fontFamily: F.mono, fontSize: 6.2, color: PDF_COLOR.violetDim, letterSpacing: 0.55 },
  pseudoVal: { fontFamily: F.bold, fontSize: 18, color: PDF_COLOR.violetDim, marginTop: 2, lineHeight: 1.05 },
  pseudoMark: { position: 'absolute', top: 8, right: 9, flexDirection: 'row', alignItems: 'center' },
  pseudoMarkTxt: { fontFamily: F.mono, fontSize: 5.5, color: PDF_COLOR.violet, letterSpacing: 0.5, marginLeft: 3 },

  typeBadge: {
    alignSelf: 'flex-start', marginTop: 4, flexDirection: 'row', alignItems: 'center',
    backgroundColor: PDF_COLOR.violetTint, borderRadius: 999, paddingHorizontal: 7.5, paddingVertical: 3,
    borderWidth: 1, borderColor: PDF_COLOR.violetTint2,
  },
  typeBadgeTxt: { fontFamily: F.bold, fontSize: 7.5, color: PDF_COLOR.violetDim, letterSpacing: 0.6 },

  // ---------- Paiement ----------
  payHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  payValidated: { flexDirection: 'row', alignItems: 'center', backgroundColor: PDF_COLOR.green, borderRadius: 6, paddingHorizontal: 11, paddingVertical: 6 },
  payCk: { width: 13, height: 13, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  payValidatedTxt: { fontFamily: F.bold, fontSize: 8.25, color: '#fff', letterSpacing: 0.82 },
  methodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  methodLogo: { height: 15, width: 15, marginRight: 6, objectFit: 'contain' },
  amountCell: { backgroundColor: PDF_COLOR.greenTint },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  amountVal: { fontFamily: F.bold, fontSize: 16.5, color: PDF_COLOR.greenDeep },
  amountCur: { fontFamily: F.bold, fontSize: 9, color: PDF_COLOR.greenDeep, marginLeft: 4 },
  statusVal: { fontFamily: F.bold, fontSize: 9.75, color: PDF_COLOR.green, marginTop: 3 },

  // ---------- Page 2 : doc info (valeurs mono) ----------
  docVal: { fontFamily: F.monoBold, fontSize: 9, color: PDF_COLOR.ink, marginTop: 3, letterSpacing: 0.1 },

  // ---------- Avertissements ----------
  warnBox: { backgroundColor: PDF_COLOR.warningTint, borderWidth: 1, borderColor: '#ecd6a6', borderRadius: 9, padding: 13.5, marginBottom: 12 },
  warnHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  warnIc: { width: 14, height: 14, borderRadius: 4, backgroundColor: PDF_COLOR.warning, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  warnIcTxt: { fontFamily: F.bold, fontSize: 8.5, color: '#fff', lineHeight: 1 },
  warnH3: { fontFamily: F.bold, fontSize: 8.25, color: PDF_COLOR.warning, letterSpacing: 0.99 },
  warnLi: { flexDirection: 'row', marginBottom: 5 },
  warnBullet: { width: 5, height: 5, marginRight: 8, marginTop: 3 },
  warnTxt: { flex: 1, fontSize: 8.25, color: PDF_COLOR.ink2, lineHeight: 1.4 },
  warnTxtCrit: { flex: 1, fontSize: 8.25, color: PDF_COLOR.crit, fontFamily: F.bold, lineHeight: 1.4 },

  // ---------- Signature / cachet ----------
  signRow: { flexDirection: 'row', marginTop: 14, alignItems: 'stretch' },
  signBox: { flex: 1, backgroundColor: PDF_COLOR.panel, borderRadius: 7.5, padding: 12, marginRight: 12, justifyContent: 'space-between' },
  signLbl: { fontFamily: F.mono, fontSize: 6.75, color: PDF_COLOR.ink3, letterSpacing: 0.81 },
  signLine: { height: 1, backgroundColor: PDF_COLOR.hair, marginTop: 26, marginBottom: 6 },
  signName: { fontSize: 7.5, color: PDF_COLOR.ink3 },
  stampBox: { width: 78, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  stamp1: { fontFamily: F.bold, fontSize: 5.6, color: PDF_COLOR.violet, letterSpacing: 1 },
  stamp2: { fontFamily: F.bold, fontSize: 9.75, color: PDF_COLOR.violetDim, letterSpacing: 0.39, marginVertical: 1.5 },
  stamp3: { fontFamily: F.mono, fontSize: 4.8, color: PDF_COLOR.violet, letterSpacing: 0.48 },

  // ---------- Découpe ----------
  detachRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 6 },
  detachLine: { flex: 1, borderTopWidth: 1, borderTopColor: PDF_COLOR.ink3, borderStyle: 'dashed' },
  detachTxt: { fontFamily: F.mono, fontSize: 6.6, color: PDF_COLOR.ink3, letterSpacing: 1.05, marginHorizontal: 9 },

  // ---------- Badge ----------
  badgeWrap: { marginTop: 4 },
  badgeCard: { position: 'relative', width: '100%', borderRadius: 15, overflow: 'hidden' },
  badgeStrip: { width: '100%', height: 4.5 },
  badgeBody: { position: 'relative', flexDirection: 'row', padding: 16.5, alignItems: 'stretch' },
  badgeMain: { flex: 1, justifyContent: 'flex-start' },
  badgeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  badgeLogo: { width: 34.5, height: 34.5, borderRadius: 9, marginRight: 10 },
  badgeName: { fontFamily: F.bold, fontSize: 12.75, color: PDF_COLOR.headerText, letterSpacing: 0.38, lineHeight: 1 },
  badgeSub: { fontFamily: F.bold, fontSize: 6.4, color: PDF_COLOR.violetBright, letterSpacing: 1.4, marginTop: 3 },
  badgeTourney: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badgeTname: { fontFamily: F.bold, fontSize: 10.5, color: PDF_COLOR.headerText, marginRight: 8 },
  badgeTypeTag: { backgroundColor: PDF_COLOR.dark3, borderRadius: 999, paddingHorizontal: 6.75, paddingVertical: 2.5, borderWidth: 1, borderColor: '#3f3168' },
  badgeTypeTxt: { fontFamily: F.bold, fontSize: 6.4, color: PDF_COLOR.violetBright, letterSpacing: 0.64 },
  badgeHero: { marginBottom: 12 },
  badgeHeroLbl: { fontFamily: F.mono, fontSize: 6.75, color: '#8a8aa0', letterSpacing: 1.35 },
  badgeHeroPseudo: { fontFamily: F.bold, fontSize: 31, color: '#fff', lineHeight: 0.95, marginTop: 2 },
  badgeFoot: { flexDirection: 'row', marginTop: 6 },
  badgeFootCol: { marginRight: 22 },
  badgeFootLbl: { fontFamily: F.mono, fontSize: 6, color: '#7a7a92', letterSpacing: 0.84 },
  badgeFootVal: { fontFamily: F.bold, fontSize: 9, color: PDF_COLOR.headerText, marginTop: 3 },

  badgeNumCol: { position: 'relative', width: 112, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingVertical: 10.5, paddingHorizontal: 7.5, marginLeft: 12, borderWidth: 1, borderColor: '#41356e' },
  badgeNumLbl: { fontFamily: F.mono, fontSize: 6.75, color: '#c4b1f7', letterSpacing: 1.35 },
  badgeNumVal: { fontFamily: F.bold, color: '#fff', lineHeight: 0.82, marginVertical: 2 },
  badgeNumStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badgeNumDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22ff88', marginRight: 4 },
  badgeNumStatusTxt: { fontFamily: F.bold, fontSize: 6, color: '#5ef0a0', letterSpacing: 0.3 },

  badgeQrCol: { width: 86, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  badgeQrCard: { backgroundColor: '#fff', borderRadius: 9, padding: 6.75 },
  badgeQrImg: { width: 66, height: 66 },
  badgeScanTxt: { fontFamily: F.bold, fontSize: 6, color: '#ffb4b4', letterSpacing: 0.5, marginTop: 6, textAlign: 'center', lineHeight: 1.3 },
  badgeIdTxt: { fontSize: 6, color: '#8a8aa0', marginTop: 3, textAlign: 'center' },
  badgeIdVal: { fontFamily: F.monoBold, color: '#d0d0e0' },

  // ---------- Pied de page ----------
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: PDF_COLOR.panel2,
    paddingVertical: 9.75, paddingHorizontal: BODY_PAD,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerBrand: { fontFamily: F.bold, fontSize: 7.5, color: PDF_COLOR.ink2, letterSpacing: 0.6 },
  footerNote: { fontSize: 6.4, color: PDF_COLOR.ink3, textAlign: 'right', lineHeight: 1.4, maxWidth: 360 },
})