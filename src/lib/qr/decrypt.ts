import 'server-only'

import { createDecipheriv } from 'node:crypto'

import { getQrEncryptionKey } from './encrypt'

/**
 * Déchiffrement du payload QR — AES-256-GCM (M11).
 * Inverse exact de `encryptQrPayload`. Lève si l'authTag est invalide
 * (QR corrompu / falsifié au niveau chiffrement).
 */
const ALGORITHM = 'aes-256-gcm'

export async function decryptQrPayload(
  base64Payload: string,
): Promise<Record<string, unknown>> {
  const combined = Buffer.from(base64Payload, 'base64url')

  const iv = combined.subarray(0, 12)
  const authTag = combined.subarray(12, 28)
  const ciphertext = combined.subarray(28)

  const key = await getQrEncryptionKey()
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return JSON.parse(decrypted.toString('utf-8'))
}