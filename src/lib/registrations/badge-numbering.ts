import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Wrapper TypeScript de la fonction PostgreSQL `assign_badge_number`.
 *
 * En pratique, le badge est attribué automatiquement par le trigger
 * `trg_registrations_assign_badge` quand une inscription passe à `confirmed`.
 * Ce wrapper existe pour les cas où l'admin (M10) doit (ré)attribuer un badge
 * explicitement. Atomique et idempotent côté SQL.
 *
 * service_role obligatoire (la fonction n'est pas exposée à authenticated).
 */
export async function assignBadgeNumber(
  registrationId: string,
): Promise<number | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('assign_badge_number', {
    p_registration_id: registrationId,
  })

  if (error) {
    console.error('[assignBadgeNumber]', error.message)
    return null
  }
  return data as number
}