/**
 * Lecture côté SERVEUR de la configuration globale (table app_config).
 *
 * Le cache est géré par next/cache (revalidate 60s). Si une mise à jour
 * doit être prise en compte immédiatement (ex : tournoi actif changé par
 * l'admin), appeler revalidateTag('app-config') depuis la Server Action
 * qui modifie la valeur.
 *
 * ⚠️ Ne pas utiliser ce module côté client. Pour les clés publiques côté
 * client, voir public-config.ts.
 *
 * ─── Pourquoi service_role et non le client SSR ? ───────────────────────
 * `getAppConfig` est wrappé dans `unstable_cache`. Or Next.js 16 INTERDIT
 * l'accès à des sources dynamiques (cookies(), headers()) dans un scope
 * `unstable_cache`. Le client SSR (./server.ts) appelle `await cookies()`,
 * ce qui déclenche l'erreur :
 *   "Route used cookies() inside a function cached with unstable_cache()".
 *
 * La config globale n'est PAS liée à l'utilisateur courant — aucune raison
 * de lire les cookies. On utilise donc le client service_role (synchrone,
 * sans cookies). La confidentialité des clés secrètes (is_secret) reste
 * garantie par la fonction SQL get_app_config elle-même.
 */
import { unstable_cache, revalidateTag } from 'next/cache'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { AppConfig, AppConfigKey } from '@/types/config.types'

const CACHE_TAG = 'app-config'

/**
 * Lit une clé typée d'app_config. Retourne undefined si la clé n'existe pas
 * OU si elle est secrète et que l'appelant n'est pas en service_role
 * (la fonction SQL get_app_config gère ce contrôle).
 *
 * Note : on passe par la RPC get_app_config même en service_role, pour
 * conserver la logique de désérialisation et de filtrage des secrets côté DB.
 */
async function fetchConfigValue<K extends AppConfigKey>(
  key: K,
): Promise<AppConfig[K] | undefined> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('get_app_config', { p_key: key })

  if (error) {
    console.error(`[app-config] Erreur lecture clé "${key}" :`, error.message)
    return undefined
  }
  if (data === null) return undefined

  return data as unknown as AppConfig[K]
}

/**
 * Lecture mise en cache (60s) d'une clé app_config.
 * ---
 * Usage :
 *   const activeId = await getAppConfig('active_tournament_id')
 *   const phones   = await getAppConfig('contact_phones')
 */
export const getAppConfig = unstable_cache(
  async <K extends AppConfigKey>(key: K) => fetchConfigValue(key),
  ['app-config-single'],
  { tags: [CACHE_TAG], revalidate: 60 },
)

/**
 * Invalide le cache de app_config — à appeler dans les Server Actions
 * qui modifient une clé.
 */
export async function revalidateAppConfig(): Promise<void> {
  ;(revalidateTag as unknown as (tag: string) => void)(CACHE_TAG)
}