import { requireSuperAdmin } from '@/lib/auth/permissions'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { QrKeyManager } from '../components/QrKeyManager'

export const metadata = {
  title: 'Cles QR — Admin',
  robots: { index: false, follow: false },
}

const QR_KEYS = ['qr_encryption_key', 'qr_signing_key'] as const

/**
 * Configuration des cles QR (SUPER_ADMIN). On lit uniquement la PRESENCE des
 * cles (jamais leur valeur, is_secret=true).
 */
export default async function QrConfigPage() {
  await requireSuperAdmin()

  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', QR_KEYS)

  const present = new Map<string, boolean>()
  for (const row of data ?? []) {
    present.set(row.key, typeof row.value === 'string' && row.value.length > 0)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Configuration
        </p>
        <h1 className="text-2xl font-bold text-text-primary">Securite des QR</h1>
      </header>

      <QrKeyManager
        encryptionKeyPresent={present.get('qr_encryption_key') ?? false}
        signingKeyPresent={present.get('qr_signing_key') ?? false}
      />
    </div>
  )
}