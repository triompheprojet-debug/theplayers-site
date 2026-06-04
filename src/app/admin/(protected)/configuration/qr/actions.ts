'use server'

import { revalidatePath } from 'next/cache'

import { ROUTES } from '@/config/routes'
import { logActivity } from '@/lib/activity/log'
import { requireSuperAdmin } from '@/lib/auth/permissions'
import { regenerateQrKeys } from '@/lib/qr/regenerate-key'

import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

/**
 * Regeneration des cles QR (SUPER_ADMIN uniquement). Invalide TOUS les badges
 * (cf. `regenerateQrKeys`, M11). La double confirmation est assuree cote UI
 * (QrKeyManager). Journalisation dans `activity_log.metadata`.
 */
export async function regenerateQrKeysAction(): Promise<
  ActionResult<{ invalidatedCount: number }>
> {
  const session = await requireSuperAdmin()

  const result = await regenerateQrKeys()
  if (!result.ok) {
    return actionError(`La regeneration a echoue : ${result.error}`)
  }

  await logActivity({
    adminId: session.adminId,
    actionType: 'regenerate_qr_keys',
    targetTable: 'app_config',
    description: `Cles QR regenerees ; ${result.invalidatedCount} badge(s) invalide(s)`,
    metadata: { invalidatedCount: result.invalidatedCount },
  })

  revalidatePath(ROUTES.admin.configuration.qr)
  return actionSuccess({ invalidatedCount: result.invalidatedCount })
}