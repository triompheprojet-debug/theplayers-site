import 'server-only'

import { createHmac } from 'node:crypto'

import { getAppConfig } from '@/lib/config/app-config'

/**
 * Signature anti-falsification du payload QR — HMAC-SHA256 (M11).
 *
 * Tronquée à 16 caractères hex (suffisant pour un usage badge, QR compact).
 * IMPORTANT : on signe le payload SANS le champ `sig`. La cohérence d'ordre
 * des clés est garantie par l'ordre d'insertion (generate puis verify
 * retirent `sig` par déstructuration, conservant le même ordre).
 */
export async function signPayload(
  payload: Record<string, unknown>,
): Promise<string> {
  const key = await getQrSigningKey()
  const serialized = JSON.stringify(payload)
  return createHmac('sha256', key).update(serialized).digest('hex').substring(0, 16)
}

export async function getQrSigningKey(): Promise<Buffer> {
  const keyB64 = await getAppConfig('qr_signing_key')
  if (!keyB64) throw new Error('qr_signing_key manquante dans app_config')
  return Buffer.from(keyB64 as string, 'base64')
}