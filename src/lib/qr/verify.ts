import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { decryptQrPayload } from './decrypt'
import { signPayload } from './sign'

/**
 * Validation d'un QR scanné (M11, utilisé au scan jour J — M13).
 *
 * Étapes : déchiffrer → vérifier la signature AVANT d'utiliser les données →
 * vérifier le tournoi (étanchéité Règle 12) → détecter le double-scan →
 * récupérer le pseudo. Chaque issue est journalisée dans `qr_scan_log`.
 */
export type ScanResult =
  | {
      valid: true
      playerId: string
      tournamentId: string
      badgeNumber: number
      pseudo: string
    }
  | {
      valid: false
      reason:
        | 'corrupted'
        | 'invalid_signature'
        | 'wrong_tournament'
        | 'already_scanned'
        | 'unknown_player'
      details?: string
    }

export async function verifyQrScan(
  encryptedPayload: string,
  activeTournamentId: string,
  scannedByAdminId: string,
  ipAddress?: string,
): Promise<ScanResult> {
  let payload: Record<string, unknown>

  // 1. Déchiffrement
  try {
    payload = await decryptQrPayload(encryptedPayload)
  } catch (err) {
    await logScan({
      result: 'corrupted',
      rawPayload: encryptedPayload,
      scannedBy: scannedByAdminId,
      ipAddress,
      errorMessage: String(err),
    })
    return { valid: false, reason: 'corrupted', details: 'QR code illisible' }
  }

  const pid = payload.pid as string | undefined
  const tid = payload.tid as string | undefined
  const bn = payload.bn as number | undefined
  const sig = payload.sig as string | undefined

  // 2. Signature (avant toute utilisation des données).
  //    On reconstruit le payload de base dans le MÊME ordre de clés que
  //    generate.ts (v, pid, tid, bn, ts) pour un HMAC déterministe.
  const basePayload = { v: payload.v, pid, tid, bn, ts: payload.ts }
  const expectedSig = await signPayload(basePayload)
  if (!sig || sig !== expectedSig) {
    await logScan({
      result: 'invalid_signature',
      playerId: pid ?? null,
      tournamentId: tid ?? null,
      badgeNumber: bn ?? null,
      rawPayload: encryptedPayload,
      scannedBy: scannedByAdminId,
      ipAddress,
    })
    return { valid: false, reason: 'invalid_signature', details: 'Signature falsifiée' }
  }

  // 3. Étanchéité tournoi (Règle 12)
  if (tid !== activeTournamentId) {
    await logScan({
      result: 'wrong_tournament',
      playerId: pid ?? null,
      tournamentId: tid ?? null,
      badgeNumber: bn ?? null,
      rawPayload: encryptedPayload,
      scannedBy: scannedByAdminId,
      ipAddress,
    })
    return { valid: false, reason: 'wrong_tournament', details: "Badge d'un autre tournoi" }
  }

  const supabase = createServiceRoleClient()

  // 4. Double-scan
  const { data: existingScan } = await supabase
    .from('qr_scan_log')
    .select('id')
    .eq('player_id', pid!)
    .eq('tournament_id', tid!)
    .eq('result', 'valid')
    .maybeSingle()

  if (existingScan) {
    await logScan({
      result: 'already_scanned',
      playerId: pid ?? null,
      tournamentId: tid ?? null,
      badgeNumber: bn ?? null,
      rawPayload: encryptedPayload,
      scannedBy: scannedByAdminId,
      ipAddress,
    })
    return { valid: false, reason: 'already_scanned', details: 'Badge déjà scanné' }
  }

  // 5. Pseudo
  const { data: profile } = await supabase
    .from('profiles')
    .select('pseudo')
    .eq('id', pid!)
    .maybeSingle()

  if (!profile) {
    await logScan({
      result: 'unknown_player',
      playerId: pid ?? null,
      tournamentId: tid ?? null,
      badgeNumber: bn ?? null,
      rawPayload: encryptedPayload,
      scannedBy: scannedByAdminId,
      ipAddress,
      errorMessage: 'Joueur introuvable',
    })
    return { valid: false, reason: 'unknown_player', details: 'Joueur inconnu' }
  }

  // 6. Scan valide
  await logScan({
    result: 'valid',
    playerId: pid ?? null,
    tournamentId: tid ?? null,
    badgeNumber: bn ?? null,
    rawPayload: encryptedPayload,
    scannedBy: scannedByAdminId,
    ipAddress,
  })

  return {
    valid: true,
    playerId: pid!,
    tournamentId: tid!,
    badgeNumber: bn!,
    pseudo: profile.pseudo,
  }
}

interface LogScanArgs {
  result: string
  playerId?: string | null
  tournamentId?: string | null
  badgeNumber?: number | null
  rawPayload: string
  scannedBy: string
  ipAddress?: string
  errorMessage?: string
}

async function logScan(args: LogScanArgs): Promise<void> {
  const supabase = createServiceRoleClient()
  await supabase.from('qr_scan_log').insert({
    result: args.result,
    player_id: args.playerId ?? null,
    tournament_id: args.tournamentId ?? null,
    badge_number: args.badgeNumber ?? null,
    raw_payload: args.rawPayload.substring(0, 500),
    scanned_by: args.scannedBy,
    ip_address: args.ipAddress ?? null,
    error_message: args.errorMessage ?? null,
  })
}