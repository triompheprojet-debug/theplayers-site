import 'server-only'

import { createCipheriv, randomBytes } from 'node:crypto'

import { getAppConfig } from '@/lib/config/app-config'

/**
 * Chiffrement du payload QR — AES-256-GCM (M11 / theplayers-qr-security).
 *
 * Format de sortie (base64url) : [IV(12) | authTag(16) | ciphertext].
 * Clé maîtresse lue dans `app_config.qr_encryption_key` (is_secret=true),
 * côté serveur uniquement. Jamais exposé au client.
 */
const ALGORITHM = 'aes-256-gcm'

export async function encryptQrPayload(
  payload: Record<string, unknown>,
): Promise<string> {
  const key = await getQrEncryptionKey()

  const iv = randomBytes(12)
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf-8')

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString('base64url')
}

/**
 * Récupère la clé AES (32 octets) depuis app_config.
 * `getAppConfig` renvoie la valeur JSON parsée (chaîne base64).
 */
export async function getQrEncryptionKey(): Promise<Buffer> {
  const keyB64 = await getAppConfig('qr_encryption_key')
  if (!keyB64) throw new Error('qr_encryption_key manquante dans app_config')
  return Buffer.from(keyB64 as string, 'base64')
}