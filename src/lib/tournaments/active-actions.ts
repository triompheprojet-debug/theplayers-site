'use server'

/**
 * Server Action pour définir / effacer le tournoi actif.
 *
 * - Permission : SUPER_ADMIN uniquement (requireSuperAdmin redirige sinon)
 * - Validation : si tournamentId !== null, vérifier que le tournoi existe
 *   et n'est pas soft-deleted
 * - Journalisation activity_log
 * - Revalidation cache via setActiveTournamentId (qui invalide app-config
 *   + revalidatePath root + admin layout)
 */
import { logActivity } from '@/lib/activity/log'
import { requireSuperAdmin } from '@/lib/auth/permissions'
import {
  getActiveTournamentId,
  setActiveTournamentId,
} from '@/lib/config/active-tournament'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

export interface SetActiveTournamentResult {
  tournamentId: string | null
}

/**
 * Définit le tournoi actif (ou efface si null).
 */
export async function setActiveTournamentAction(
  tournamentId: string | null,
): Promise<ActionResult<SetActiveTournamentResult>> {
  // ─── 1. Auth — SUPER_ADMIN requis ───────────────────────────────────
  // requireSuperAdmin redirige si non autorisé : on l'attrape pas
  // (la modale ne s'ouvre de toute façon pas pour un non-SA)
  const session = await requireSuperAdmin()

  // ─── 2. Validation de l'ID si non-null ──────────────────────────────
  if (tournamentId !== null) {
    if (!isValidUuid(tournamentId)) {
      return actionError('Identifiant de tournoi invalide.')
    }

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, is_deleted')
      .eq('id', tournamentId)
      .maybeSingle()

    if (error) {
      return actionError(
        `Vérification du tournoi impossible : ${error.message}`,
      )
    }
    if (!data) {
      return actionError('Tournoi introuvable.')
    }
    if (data.is_deleted) {
      return actionError(
        'Ce tournoi a été supprimé, impossible de l\'activer.',
      )
    }
  }

  // ─── 3. Capturer l'état précédent pour l'audit ──────────────────────
  const previousId = await getActiveTournamentId()

  // ─── 4. No-op si identique ──────────────────────────────────────────
  if (previousId === tournamentId) {
    return actionSuccess({ tournamentId })
  }

  // ─── 5. Mise à jour effective ───────────────────────────────────────
  try {
    await setActiveTournamentId(tournamentId)
  } catch (err) {
    return actionError(
      err instanceof Error ? err.message : 'Erreur inattendue.',
    )
  }

  // ─── 6. Audit log ───────────────────────────────────────────────────
  await logActivity({
    adminId: session.adminId,
    actionType: 'set_active_tournament',
    targetTable: 'app_config',
    description: tournamentId
      ? `Tournoi actif redéfini`
      : 'Aucun tournoi actif (effacé)',
    metadata: {
      previous_tournament_id: previousId,
      new_tournament_id: tournamentId,
    },
  })

  return actionSuccess({ tournamentId })
}

/**
 * Validation UUID v4 simple (suffisante pour Postgres uuid).
 */
function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}