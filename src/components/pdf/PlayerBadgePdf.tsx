import {
  Document,
  Image,
  Page,
  Text,
  View,
} from '@react-pdf/renderer'

import { pdfStyles as s } from './pdf-styles'
import { PDF_FONT } from './pdf-fonts'

/**
 * PDF officiel d'une inscription confirmée : REÇU + BADGE (M11).
 *
 * Composant purement présentationnel : il reçoit des libellés DÉJÀ formatés
 * (montant, méthode Règle 3, dates, lieu, contacts) — aucune lecture DB, aucun
 * calcul métier, aucune capacité (Règle 1). Rendu côté serveur uniquement via
 * renderToBuffer (cf. src/lib/documents/generate-pdf.ts). Aucun emoji.
 */
export interface PlayerBadgePdfProps {
  tournamentName: string
  gameName: string
  pseudo: string
  badgeNumber: number
  amountLabel: string // ex. « 5 000 FCFA »
  methodLabel: string // ex. « MTN Mobile Money » (Règle 3)
  transactionRef: string | null
  confirmedAtLabel: string
  venueLabel: string
  contactLabel: string | null
  qrDataUrl: string
  documentRef: string // identifiant court du document (traçabilité)
}

export function PlayerBadgePdf(props: PlayerBadgePdfProps) {
  return (
    <Document
      title={`Recu et badge - ${props.pseudo}`}
      author="THE PLAYERS"
      subject={props.tournamentName}
    >
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <Text style={s.headerTitle}>{props.tournamentName}</Text>
          <Text style={s.headerSub}>
            {"Document officiel d'inscription"} - {props.gameName}
          </Text>
        </View>

        {/* Reçu */}
        <Text style={s.sectionTitle}>{"Recu d'inscription"}</Text>
        <View style={s.card}>
          <Field label="Joueur" value={props.pseudo} />
          <Field label="Montant" value={props.amountLabel} />
          <Field label="Methode de paiement" value={props.methodLabel} />
          {props.transactionRef ? (
            <Field label="Reference transaction" value={props.transactionRef} />
          ) : null}
          <Field label="Confirme le" value={props.confirmedAtLabel} />
          <Field label="Lieu" value={props.venueLabel} />
        </View>

        {/* Badge */}
        <Text style={s.sectionTitle}>{"Badge d'acces"}</Text>
        <View style={s.card}>
          <View style={s.badgeRow}>
            <View style={s.badgeInfo}>
              <Text style={s.badgeNumberLabel}>Numero de badge</Text>
              <Text style={s.badgeNumber}>
                {String(props.badgeNumber).padStart(3, '0')}
              </Text>
              <Text style={s.badgePseudo}>{props.pseudo}</Text>
              <Text style={{ fontSize: 9, color: '#475569', marginTop: 6 }}>
                {"A presenter a l'entree le jour de l'evenement."}
              </Text>
            </View>
            <View style={s.qrBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={s.qrImage} src={props.qrDataUrl} />
              <Text style={s.qrCaption}>{"Scan a l'entree"}</Text>
            </View>
          </View>
        </View>

        {/* Pied de page */}
        <View style={s.footer} fixed>
          <Text style={{ fontFamily: PDF_FONT.bold }}>
            Reference : {props.documentRef}
          </Text>
          {props.contactLabel ? <Text>Contact : {props.contactLabel}</Text> : null}
          <Text>
            Document personnel et non transferable. Aucun remboursement.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  )
}