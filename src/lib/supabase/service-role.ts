/**
 * Client Supabase avec SERVICE_ROLE_KEY — bypass total de la RLS.
 *
 * ⚠️ DANGER : ce client a tous les pouvoirs sur la base.
 *  - À utiliser UNIQUEMENT côté serveur (Server Actions / Route Handlers)
 *  - JAMAIS dans un Client Component
 *  - JAMAIS exposer la clé côté client (pas de NEXT_PUBLIC_*)
 *
 * Usages légitimes :
 *  - Création d'admin par SUPER_ADMIN (M02)
 *  - Lecture/écriture de app_config secrètes (qr_*)
 *  - Cron jobs (process-jobs, daily-cleanup)
 *  - Opérations qui doivent bypasser la RLS pour des raisons techniques
 *
 * Tout autre usage doit passer par createClient() de ./server.ts (RLS active).
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { getServerEnv } from '@/lib/utils/env'
import type { Database } from '@/types/database.types'

export function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createServiceRoleClient() ne doit JAMAIS être appelé côté navigateur. ' +
        'La clé service_role bypass la RLS — exposition côté client = brèche de sécurité critique.',
    )
  }

  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv()

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}