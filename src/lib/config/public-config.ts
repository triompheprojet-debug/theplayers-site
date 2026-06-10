/**
 * Lecture des clés PUBLIQUES de app_config via la vue public_app_config_view.
 *
 * Cette vue filtre is_secret = true, donc accessible en lecture par anon
 * et authenticated. Utilisable depuis n'importe quel composant Server.
 *
 * Cache identique à app-config.ts (60s + invalidation par tag).
 */
import { unstable_cache, revalidateTag} from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { AppConfig } from '@/types/config.types'

const CACHE_TAG = 'public-config'

/**
 * Toutes les clés non-secrètes d'app_config en une seule requête.
 * Renvoie un objet typé (Partial car certaines clés peuvent manquer en seed).
 */
export const getPublicConfig = unstable_cache(
  async (): Promise<Partial<AppConfig>> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('public_app_config_view')
      .select('key, value')

    if (error) {
      console.error('[public-config] Erreur lecture :', error.message)
      return {}
    }
    if (!data) return {}

    // Conversion array → object typé
    return data.reduce<Partial<AppConfig>>((acc, row) => {
      // @ts-expect-error - le mapping key → value est garanti par le seed mais
      // TS ne peut pas inférer cette correspondance dynamique
      acc[row.key as keyof AppConfig] = row.value
      return acc
    }, {})
  },
  ['public-config-all'],
  { tags: [CACHE_TAG], revalidate: 60 },
)

/**
 * Invalide le cache (à appeler depuis les Server Actions admin qui
 * modifient les clés publiques : site_message, social_links, etc.).
 */
export async function revalidatePublicConfig(): Promise<void> {

  (revalidateTag as unknown as (tag: string) => void)(CACHE_TAG)
}