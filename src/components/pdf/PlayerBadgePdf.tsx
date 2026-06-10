import {
  Document,
  Image,
  Page,
  Svg,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Polygon,
  Path,
  Line,
  Text,
  View,
} from '@react-pdf/renderer'

import { pdfStyles as s, PDF_COLOR as C } from './pdf-styles'

/**
 * PDF officiel d'une inscription confirmée : REÇU (page 1) + INFOS/BADGE
 * détachable (page 2). M11. Rendu fidèle à la maquette HTML.
 *
 * Composant PUREMENT présentationnel : reçoit des libellés DÉJÀ formatés.
 * Aucune lecture DB, aucun calcul métier, aucune capacité (Règle 1). Rendu
 * serveur via renderToBuffer. Dégradés en SVG (react-pdf ne gère pas les
 * gradients CSS). Aucun emoji.
 *
 * NOTE JSX : tout texte avec apostrophe est en expression {"..."}.
 */
export interface PlayerBadgePdfProps {
  logoDataUrl: string | null
  methodLogoDataUrl: string | null
  qrDataUrl: string

  receiptNumber: string
  generatedAtLabel: string
  generationDateLabel: string
  serviceCity: string
  documentVersion: string
  documentUid: string

  pseudo: string
  firstName: string
  lastName: string
  phone: string
  badgeNumber: number

  tournamentName: string
  eventTypeLabel: string
  seasonLabel: string | null
  tournamentInSeasonLabel: string | null
  gameName: string
  eventDateLabel: string
  eventDateShortLabel: string
  arrivalTimeLabel: string
  organizer: string
  venueName: string
  cityLabel: string

  paymentStatusLabel: string
  methodLabel: string
  methodShort: 'mtn' | 'airtel' | 'cash' | null
  amountValue: string
  transactionRef: string
  payerPhone: string
  payerName: string
  paymentDateLabel: string
  validationDateLabel: string
  validatorLabel: string

  badgeId: string
  contactLabel: string | null
}

export function PlayerBadgePdf(props: PlayerBadgePdfProps) {
  const num = String(props.badgeNumber)
  const bnSize = num.length >= 3 ? 52 : 78

  return (
    <Document
      title={`Recu et badge - ${props.pseudo}`}
      author="THE PLAYERS"
      subject={props.tournamentName}
    >
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <HeaderBackground />

          <View style={s.hTop}>
            <View style={s.brand}>
              {props.logoDataUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image style={s.brandLogo} src={props.logoDataUrl} />
              ) : null}
              <View>
                <Text style={s.brandName}>THE PLAYERS</Text>
                <Text style={s.brandSub}>LIGUE ESPORT FC</Text>
                <Text style={s.docKind}>{"REÇU OFFICIEL D'INSCRIPTION"}</Text>
              </View>
            </View>

            <View style={s.hRight}>
              <View style={s.chip}>
                <View style={s.chipDot} />
                <Text style={s.chipText}>INSCRIPTION CONFIRMÉE</Text>
              </View>
              <Text style={s.genDate}>
                {'Généré le '}
                <Text style={s.genDateB}>{props.generatedAtLabel}</Text>
              </Text>
              <View style={s.receiptRow}>
                <Text style={s.receiptLbl}>{'REÇU N° '}</Text>
                <Text style={s.receiptVal}>{props.receiptNumber}</Text>
              </View>
            </View>
          </View>

          <View style={s.hBottom}>
            <View>
              <Text style={s.serviceLbl}>Service administratif & comptable</Text>
              <Text style={s.serviceVal}>{`THE PLAYERS — ${props.serviceCity}`}</Text>
            </View>
            <View style={s.hBadges}>
              <View style={s.qrCard}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image style={s.qrCardImg} src={props.qrDataUrl} />
                <Text style={s.qrCardCap}>VÉRIFICATION</Text>
              </View>
              <View style={s.pnBox}>
                <GradientFill id="pn" w={90} h={70} rx={9} x2={0.4} y2={1}
                  stops={[{ o: '0', c: C.violetBright }, { o: '1', c: C.violetDim }]} />
                <Text style={s.pnLabel}>{'N° JOUEUR'}</Text>
                <Text style={s.pnNum}>{num}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Barre d'accent */}
        <View style={s.accent}>
          <GradientFill id="acc1" w={595} h={4} x2={1} y2={0}
            stops={[{ o: '0', c: C.violet }, { o: '0.4', c: C.violetBright }, { o: '1', c: C.greenNeon }]} />
        </View>

        <View style={s.body}>
          {/* Section A */}
          <View style={s.sectionTag}>
            <View style={s.pill}><Text style={s.pillText}>A</Text></View>
            <Text style={s.tagTitle}>REÇU OFFICIEL</Text>
            <View style={s.tagLine} />
          </View>

          {/* Informations personnelles */}
          <BlockHead label="INFORMATIONS PERSONNELLES" />
          <View style={s.grid}>
            <View style={[s.row, s.rowDivider]}>
              <View style={[s.cell, s.cellDivider, s.pseudoCell, { width: '34%' }]}>
                <View style={s.pseudoMark}>
                  <Star />
                  <Text style={s.pseudoMarkTxt}>PSEUDO</Text>
                </View>
                <Text style={s.pseudoLbl}>PSEUDO EA FC</Text>
                <Text style={s.pseudoVal}>{props.pseudo}</Text>
              </View>
              <Cell w="33%" label="NOM" value={props.lastName} divider />
              <Cell w="33%" label="PRÉNOM" value={props.firstName} />
            </View>
            <View style={s.row}>
              <Cell w="34%" label="NUMÉRO DE TÉLÉPHONE" value={props.phone} divider />
              <Cell w="33%" label="JEU OFFICIEL" value={props.gameName} divider />
              <Cell w="33%" label="NUMÉRO JOUEUR" value={`#${num}`} />
            </View>
          </View>

          {/* Informations du tournoi */}
          <BlockHead label="INFORMATIONS DU TOURNOI" />
          <View style={s.grid}>
            <View style={[s.row, s.rowDivider]}>
              <Cell w="62%" label="NOM DU TOURNOI" value={props.tournamentName} divider />
              <View style={[s.cell, { width: '38%' }]}>
                <Text style={s.cellLabel}>{"TYPE D'ÉVÉNEMENT"}</Text>
                <View style={s.typeBadge}>
                  <Text style={s.typeBadgeTxt}>{props.eventTypeLabel}</Text>
                </View>
              </View>
            </View>
            <View style={[s.row, s.rowDivider]}>
              <Cell w="34%" label="SAISON PARENTE" value={props.seasonLabel ?? '—'} divider />
              <Cell w="33%" label="TOURNOI DANS LA SAISON" value={props.tournamentInSeasonLabel ?? '—'} divider />
              <Cell w="33%" label="ORGANISATEUR" value={props.organizer} />
            </View>
            <View style={[s.row, s.rowDivider]}>
              <Cell w="34%" label="DATE DE L'ÉVÉNEMENT" value={props.eventDateLabel} divider />
              <Cell w="33%" label="HEURE D'ACCUEIL" value={props.arrivalTimeLabel} divider />
              <Cell w="33%" label="VILLE" value={props.cityLabel} />
            </View>
            <View style={s.row}>
              <Cell w="100%" label="LIEU" value={props.venueName} />
            </View>
          </View>

          {/* Informations de paiement */}
          <View style={s.payHead}>
            <BlockHead label="INFORMATIONS DE PAIEMENT" inline />
            <View style={s.payValidated}>
              <View style={s.payCk}><Check /></View>
              <Text style={s.payValidatedTxt}>PAIEMENT VALIDÉ</Text>
            </View>
          </View>
          <View style={s.grid}>
            <View style={[s.row, s.rowDivider]}>
              <Cell w="34%" label="STATUT DU PAIEMENT" value={props.paymentStatusLabel} valueStyle={s.statusVal} divider />
              <View style={[s.cell, s.cellDivider, { width: '33%' }]}>
                <Text style={s.cellLabel}>MOYEN DE PAIEMENT</Text>
                <View style={s.methodRow}>
                  {props.methodLogoDataUrl ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image style={s.methodLogo} src={props.methodLogoDataUrl} />
                  ) : null}
                  <Text style={s.cellValue}>{props.methodLabel}</Text>
                </View>
              </View>
              <View style={[s.cell, s.amountCell, { width: '33%' }]}>
                <Text style={s.cellLabel}>MONTANT PAYÉ</Text>
                <View style={s.amountRow}>
                  <Text style={s.amountVal}>{props.amountValue}</Text>
                  <Text style={s.amountCur}>FCFA</Text>
                </View>
              </View>
            </View>
            <View style={[s.row, s.rowDivider]}>
              <Cell w="34%" label="RÉFÉRENCE DE TRANSACTION" value={props.transactionRef} mono divider />
              <Cell w="33%" label="NUMÉRO AYANT PAYÉ" value={props.payerPhone} divider />
              <Cell w="33%" label="TITULAIRE DU NUMÉRO" value={props.payerName} />
            </View>
            <View style={s.row}>
              <Cell w="34%" label="DATE DU PAIEMENT" value={props.paymentDateLabel} divider />
              <Cell w="33%" label="DATE DE VALIDATION" value={props.validationDateLabel} divider />
              <Cell w="33%" label="AGENT DE VALIDATION" value={props.validatorLabel} />
            </View>
          </View>
        </View>

        <Footer page="1" />
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={s.page}>
        <View style={s.accent}>
          <GradientFill id="acc2" w={595} h={4} x2={1} y2={0}
            stops={[{ o: '0', c: C.violet }, { o: '0.4', c: C.violetBright }, { o: '1', c: C.greenNeon }]} />
        </View>

        <View style={s.body}>
          {/* Informations du document */}
          <BlockHead label="INFORMATIONS DU DOCUMENT" />
          <View style={s.grid}>
            <View style={[s.row, s.rowDivider]}>
              <Cell w="50%" label="NUMÉRO DU REÇU" value={props.receiptNumber} mono divider />
              <Cell w="50%" label="DATE DE GÉNÉRATION" value={props.generationDateLabel} mono />
            </View>
            <View style={s.row}>
              <Cell w="50%" label="VERSION DU DOCUMENT" value={props.documentVersion} mono divider />
              <Cell w="50%" label="IDENTIFIANT UNIQUE DU DOCUMENT" value={props.documentUid} mono />
            </View>
          </View>

          {/* Avertissements */}
          <BlockHead label="AVERTISSEMENTS ET INDICATIONS" />
          <View style={s.warnBox}>
            <View style={s.warnHead}>
              <View style={s.warnIc}><Text style={s.warnIcTxt}>!</Text></View>
              <Text style={s.warnH3}>À LIRE ATTENTIVEMENT</Text>
            </View>
            <WarnItem text="Ce document confirme votre participation au tournoi indiqué ci-dessus." />
            <WarnItem text={"Conservez ce reçu jusqu'à la fin de l'événement."} />
            <WarnItem text="Présentez votre badge joueur lors de votre arrivée." />
            <WarnItem text="Le paiement constitue un engagement définitif de participation." />
            <WarnItem text="Aucun remboursement n'est possible." crit />
            <WarnItem text={"Toute tentative de falsification entraîne l'annulation immédiate de l'inscription."} crit />
            <WarnItem text={"Le QR Code est réservé exclusivement à l'équipe d'organisation THE PLAYERS."} />
          </View>

          {/* Signature & cachet */}
          <View style={s.signRow}>
            <View style={s.signBox}>
              <Text style={s.signLbl}>SIGNATURE & CACHET OFFICIEL</Text>
              <View style={s.signLine} />
              <Text style={s.signName}>{'THE PLAYERS — Service administratif'}</Text>
            </View>
            <Stamp />
          </View>

          {/* Découpe */}
          <View style={s.detachRow}>
            <View style={s.detachLine} />
            <Scissors />
            <Text style={s.detachTxt}>
              {'DÉTACHER ET PRÉSENTER LE BADGE LE JOUR DU TOURNOI'}
            </Text>
            <View style={s.detachLine} />
          </View>

          {/* Badge joueur */}
          <View style={s.sectionTag}>
            <View style={[s.pill, s.pillB]}><Text style={s.pillText}>B</Text></View>
            <Text style={s.tagTitle}>BADGE JOUEUR</Text>
            <View style={s.tagLine} />
          </View>

          <View style={s.badgeWrap}>
            <View style={s.badgeCard}>
              <GradientFill id="bgcard" w={539} h={200} rx={15} x2={1} y2={1}
                stops={[{ o: '0', c: C.dark }, { o: '0.55', c: '#191430' }, { o: '1', c: C.dark2 }]} />

              <View style={s.badgeStrip}>
                <GradientFill id="bstrip" w={539} h={5} x2={1} y2={0}
                  stops={[{ o: '0', c: C.violet }, { o: '0.5', c: C.violetBright }, { o: '1', c: C.greenNeon }]} />
              </View>

              <View style={s.badgeBody}>
                <View style={s.badgeMain}>
                  <View style={s.badgeTop}>
                    {props.logoDataUrl ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image style={s.badgeLogo} src={props.logoDataUrl} />
                    ) : null}
                    <View>
                      <Text style={s.badgeName}>THE PLAYERS</Text>
                      <Text style={s.badgeSub}>LIGUE ESPORT FC</Text>
                    </View>
                  </View>

                  <View style={s.badgeTourney}>
                    <Text style={s.badgeTname}>{props.tournamentName}</Text>
                    <View style={s.badgeTypeTag}>
                      <Text style={s.badgeTypeTxt}>{props.eventTypeLabel}</Text>
                    </View>
                  </View>

                  <View style={s.badgeHero}>
                    <Text style={s.badgeHeroLbl}>JOUEUR</Text>
                    <Text style={s.badgeHeroPseudo}>{props.pseudo}</Text>
                  </View>

                  <View style={s.badgeFoot}>
                    <View style={s.badgeFootCol}>
                      <Text style={s.badgeFootLbl}>JEU OFFICIEL</Text>
                      <Text style={s.badgeFootVal}>{props.gameName}</Text>
                    </View>
                    <View style={s.badgeFootCol}>
                      <Text style={s.badgeFootLbl}>DATE DU TOURNOI</Text>
                      <Text style={s.badgeFootVal}>{props.eventDateShortLabel}</Text>
                    </View>
                  </View>
                </View>

                <View style={s.badgeNumCol}>
                  <GradientFill id="bnum" w={112} h={170} rx={12} x2={0.5} y2={1}
                    stops={[
                      { o: '0', c: C.violetBright, op: 0.22 },
                      { o: '1', c: C.violetDim, op: 0.05 },
                    ]} />
                  <Text style={s.badgeNumLbl}>{'N° JOUEUR'}</Text>
                  <Text style={[s.badgeNumVal, { fontSize: bnSize }]}>{num}</Text>
                  <View style={s.badgeNumStatus}>
                    <View style={s.badgeNumDot} />
                    <Text style={s.badgeNumStatusTxt}>JOUEUR CONFIRMÉ</Text>
                  </View>
                </View>

                <View style={s.badgeQrCol}>
                  <View style={s.badgeQrCard}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image style={s.badgeQrImg} src={props.qrDataUrl} />
                  </View>
                  <Text style={s.badgeScanTxt}>{'SCAN ADMIN\nUNIQUEMENT'}</Text>
                  <Text style={s.badgeIdTxt}>
                    {'ID '}
                    <Text style={s.badgeIdVal}>{props.badgeId}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Footer page="2" />
      </Page>
    </Document>
  )
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

const absFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }

function HeaderBackground() {
  return (
    <Svg viewBox="0 0 595 156" preserveAspectRatio="none" style={absFill}>
      <Defs>
        <RadialGradient id="hg1" cx="500" cy="-15" r="357" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={C.violetBright} stopOpacity={0.4} />
          <Stop offset="0.46" stopColor={C.violetBright} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="hg2" cx="24" cy="180" r="300" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={C.violetDim} stopOpacity={0.3} />
          <Stop offset="0.5" stopColor={C.violetDim} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="595" height="156" fill={C.dark} />
      <Rect x="0" y="0" width="595" height="156" fill="url(#hg1)" />
      <Rect x="0" y="0" width="595" height="156" fill="url(#hg2)" />
    </Svg>
  )
}

function GradientFill({
  id, w, h, stops, x2 = 1, y2 = 1, rx = 0,
}: {
  id: string
  w: number
  h: number
  stops: { o: string; c: string; op?: number }[]
  x2?: number
  y2?: number
  rx?: number
}) {
  return (
    <Svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={absFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={String(x2)} y2={String(y2)}>
          {stops.map((st, i) => (
            <Stop key={i} offset={st.o} stopColor={st.c} stopOpacity={st.op ?? 1} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={w} height={h} rx={rx} ry={rx} fill={`url(#${id})`} />
    </Svg>
  )
}

function Diamond({ size = 6.75, color = C.violet }: { size?: number; color?: string }) {
  const m = size / 2
  return (
    <Svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <Polygon points={`${m},0 ${size},${m} ${m},${size} 0,${m}`} fill={color} />
    </Svg>
  )
}

function Star({ size = 7, color = C.violet }: { size?: number; color?: string }) {
  // Étoile 5 branches (remplace ★ non disponible dans les polices intégrées)
  const pts = starPoints(size / 2, size / 2, size / 2, size / 4.2, 5)
  return (
    <Svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <Polygon points={pts} fill={color} />
    </Svg>
  )
}

function starPoints(cx: number, cy: number, outer: number, inner: number, spikes: number): string {
  let rot = -Math.PI / 2
  const step = Math.PI / spikes
  const out: string[] = []
  for (let i = 0; i < spikes; i++) {
    out.push(`${cx + Math.cos(rot) * outer},${cy + Math.sin(rot) * outer}`)
    rot += step
    out.push(`${cx + Math.cos(rot) * inner},${cy + Math.sin(rot) * inner}`)
    rot += step
  }
  return out.join(' ')
}

function Check() {
  return (
    <Svg viewBox="0 0 10 10" style={{ width: 7, height: 7 }}>
      <Path d="M1.2 5 L3.8 7.4 L8.8 2" stroke="#fff" strokeWidth={1.6} fill="none" />
    </Svg>
  )
}

function Scissors() {
  return (
    <Svg viewBox="0 0 18 16" style={{ width: 14, height: 13, marginRight: 4 }}>
      <Circle cx="4" cy="11.5" r="2.4" stroke={C.ink3} strokeWidth={1} fill="none" />
      <Circle cx="4" cy="4.5" r="2.4" stroke={C.ink3} strokeWidth={1} fill="none" />
      <Line x1="6" y1="6" x2="17" y2="13" stroke={C.ink3} strokeWidth={1} />
      <Line x1="6" y1="10" x2="17" y2="3" stroke={C.ink3} strokeWidth={1} />
    </Svg>
  )
}

function Stamp() {
  return (
    <View style={s.stampBox}>
      <Svg viewBox="0 0 78 78" style={{ position: 'absolute', top: 0, left: 0, width: 78, height: 78 }}>
        <Circle cx="39" cy="39" r="36" stroke={C.violet} strokeWidth={1.4} strokeDasharray="4 3" fill="none" />
        <Circle cx="39" cy="39" r="30" stroke={C.violetDim} strokeWidth={0.6} fill="none" />
      </Svg>
      <Text style={s.stamp1}>THE PLAYERS</Text>
      <Text style={s.stamp2}>VALIDÉ</Text>
      <Text style={s.stamp3}>LIGUE ESPORT FC</Text>
    </View>
  )
}

function BlockHead({ label, inline }: { label: string; inline?: boolean }) {
  return (
    <View style={[s.blockHead, inline ? { marginBottom: 0, flex: 1 } : {}]}>
      <View style={s.blockMark}><Diamond /></View>
      <Text style={s.blockH2}>{label}</Text>
      <View style={s.blockRule} />
    </View>
  )
}

type PdfStyle = (typeof s)[keyof typeof s]

function Cell({
  w, label, value, divider, mono, valueStyle,
}: {
  w: string
  label: string
  value: string
  divider?: boolean
  mono?: boolean
  valueStyle?: PdfStyle
}) {
  const vStyle: PdfStyle = valueStyle ?? (mono ? s.cellValueMono : s.cellValue)
  return (
    <View style={[s.cell, { width: w }, divider ? s.cellDivider : {}]}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={vStyle}>{value}</Text>
    </View>
  )
}

function WarnItem({ text, crit }: { text: string; crit?: boolean }) {
  return (
    <View style={s.warnLi}>
      <View style={s.warnBullet}>
        <Diamond size={5} color={crit ? C.crit : C.warning} />
      </View>
      <Text style={crit ? s.warnTxtCrit : s.warnTxt}>{text}</Text>
    </View>
  )
}

function Footer({ page }: { page: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerBrand}>{'THE PLAYERS — LIGUE ESPORT FC'}</Text>
      <Text style={s.footerNote}>
        {`Document officiel généré automatiquement par la plateforme THE PLAYERS.\nTous droits réservés · Page ${page} / 2`}
      </Text>
    </View>
  )
}