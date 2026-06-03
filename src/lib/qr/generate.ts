import 'server-only'

import QRCode from 'qrcode'

import { encryptQrPayload } from './encrypt'
import { signPayload } from './sign'

/**
 * Génération du QR chiffré + signé d'un badge (M11).
 *
 * Sortie `qrDataUrl` = image PNG en data URL, à intégrer dans le PDF via
 * <Image> de @react-pdf/renderer (le SVG brut ne s'intègre pas directement
 * dans react-pdf — cf. note skill theplayers-phase-m11).
 *
 * Le payload signé puis chiffré encode (player_id, tournament_id, badge,
 * timestamp). L'étanchéité par tournoi (Règle 12) est vérifiée au scan.
 */
export interface BadgeQr {
  qrDataUrl: string
  encryptedPayload: string
  signature: string
}

export async function generateBadgeQr(
  playerId: string,
  tournamentId: string,
  badgeNumber: number,
): Promise<BadgeQr> {
  // 1. Payload de base (v = version de FORMAT du payload, ≠ version de clé)
  const basePayload = {
    v: 1,
    pid: playerId,
    tid: tournamentId,
    bn: badgeNumber,
    ts: Math.floor(Date.now() / 1000),
  }

  // 2. Signer le payload de base, puis l'inclure
  const signature = await signPayload(basePayload)
  const fullPayload = { ...basePayload, sig: signature }

  // 3. Chiffrer l'ensemble
  const encryptedPayload = await encryptQrPayload(fullPayload)

  // 4. Image PNG (data URL) pour le PDF
  const qrDataUrl = await QRCode.toDataURL(encryptedPayload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
  })

  return { qrDataUrl, encryptedPayload, signature }
}