/**
 * Bootstrap des cles QR dans `app_config` (filet de securite / doc).
 *
 * En prod les cles existent deja : ce script ne touche a rien si elles sont
 * presentes. Il sert a initialiser un environnement neuf (les lignes
 * `qr_encryption_key` / `qr_signing_key` doivent exister, creees par migration).
 *
 * Execution :
 *   tsx --env-file=.env.local scripts/generate-qr-keys.ts
 *   tsx --env-file=.env.local scripts/generate-qr-keys.ts --force   (ECRASE : invalide les badges)
 *
 * Convention de stockage identique a src/lib/qr/regenerate-key.ts :
 *   JSON.stringify(<base64 de 32 octets aleatoires>).
 */
import { randomBytes } from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

const QR_KEYS = ['qr_encryption_key', 'qr_signing_key'] as const

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error(
      'Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (--env-file=.env.local).',
    )
    process.exit(1)
  }

  const force = process.argv.includes('--force')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  })

  for (const key of QR_KEYS) {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (error) {
      console.error(`[${key}] lecture echouee : ${error.message}`)
      process.exit(1)
    }

    if (!data) {
      console.warn(
        `[${key}] ligne absente dans app_config — a creer via migration. Ignoree.`,
      )
      continue
    }

    const hasValue = typeof data.value === 'string' && data.value.length > 0
    if (hasValue && !force) {
      console.log(`[${key}] deja presente — ignoree (--force pour ecraser).`)
      continue
    }

    const newKey = randomBytes(32).toString('base64')
    const { error: updateError } = await supabase
      .from('app_config')
      .update({ value: JSON.stringify(newKey) })
      .eq('key', key)

    if (updateError) {
      console.error(`[${key}] ecriture echouee : ${updateError.message}`)
      process.exit(1)
    }

    console.log(`[${key}] ${hasValue ? 'ecrasee' : 'generee'}.`)
  }

  if (force) {
    console.warn(
      'ATTENTION : --force a ete utilise. Les badges existants sont invalides : relance la generation des PDF.',
    )
  }
  console.log('Termine.')
}

void main()