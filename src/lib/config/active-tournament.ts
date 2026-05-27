/**
 * Helpers pour lire/écrire `app_config.active_tournament_id`.
 *
 * Lecture : passe par `getAppConfig` (cache 60s via next/cache).
 * Écriture : service_role (RLS bloquante sur app_config),
 * + invalidation cache + revalidatePath root.
 *
 * Le tournoi actif est le pivot du site public — une mise à jour
 * doit immédiatement se refléter pour tous les visiteurs.
 */
import 'server-only'

import { revalidatePath } from 'next/cache'

import { getAppConfig, revalidateAppConfig } from '@/lib/config/app-config'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const ACTIVE_KEY = 'active_tournament_id'

/**
 * Lit l'UUID du tournoi actif. Renvoie null si aucun n'est défini.
 *
 * Note : la valeur en DB est un jsonb pouvant être `null` ou `"<uuid>"`.
 * `getAppConfig` la désérialise en `null | string`.
 */
export async function getActiveTournamentId(): Promise<string | null> {
  const value = await getAppConfig(ACTIVE_KEY)
  if (value === undefined || value === null) return null
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * Définit (ou efface) le tournoi actif.
 *
 * - tournamentId === null  → "aucun tournoi actif"
 * - tournamentId === uuid  → ce tournoi devient le tournoi en vedette public
 *
 * ⚠️ Ne vérifie PAS l'existence du tournoi ni la permission de l'appelant.
 * Ces contrôles incombent à la Server Action appelante (M03.C).
 */
export async function setActiveTournamentId(
  tournamentId: string | null,
): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('app_config')
    .update({
      // jsonb : Supabase JS sérialise automatiquement
      value: tournamentId as never,
      // updated_by sera renseigné par l'appelant via une 2e update au besoin
    })
    .eq('key', ACTIVE_KEY)

  if (error) {
    throw new Error(
      `Impossible de mettre à jour le tournoi actif : ${error.message}`,
    )
  }

  // Invalide le cache app-config et l'arbre de pages
  await revalidateAppConfig()
  revalidatePath('/', 'layout')
  revalidatePath('/admin', 'layout')
}
