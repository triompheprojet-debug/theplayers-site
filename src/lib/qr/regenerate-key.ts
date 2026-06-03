import 'server-only'

import { randomBytes } from 'node:crypto'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Régénération des clés QR (SUPER_ADMIN — M11 étape 2 / configuration).
 *
 * CRITIQUE : invalide TOUS les badges existants. Doit être protégé par une
 * double confirmation côté UI. Après régénération, l'admin doit relancer la
 * génération de tous les PDFs (bouton « Régénérer tout », M11 étape 2).
 *
 * Les clés sont stockées en JSON dans `app_config` (is_secret=true) :
 * JSON.stringify(<base64>) → chaîne JSON valide, relue parsée par getAppConfig.
 */
export type RegenerateKeysResult =
  | { ok: true; invalidatedCount: number }
  | { ok: false; error: string }

export async function regenerateQrKeys(): Promise<RegenerateKeysResult> {
  const supabase = createServiceRoleClient()

  // 1. Nouvelles clés (32 octets chacune)
  const newEncKey = randomBytes(32).toString('base64')
  const newSigKey = randomBytes(32).toString('base64')

  // 2. Mise à jour app_config
  const { error: encErr } = await supabase
    .from('app_config')
    .update({ value: JSON.stringify(newEncKey) })
    .eq('key', 'qr_encryption_key')
  if (encErr) return { ok: false, error: encErr.message }

  const { error: sigErr } = await supabase
    .from('app_config')
    .update({ value: JSON.stringify(newSigKey) })
    .eq('key', 'qr_signing_key')
  if (sigErr) return { ok: false, error: sigErr.message }

  // 3. Invalider tous les badges existants
  const { data: invalidated, error: invErr } = await supabase
    .from('documents')
    .update({ is_valid: false })
    .eq('doc_type', 'receipt_badge')
    .eq('is_valid', true)
    .select('id')
  if (invErr) return { ok: false, error: invErr.message }

  return { ok: true, invalidatedCount: invalidated?.length ?? 0 }
}