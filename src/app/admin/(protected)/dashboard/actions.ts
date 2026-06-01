'use server'

/**
 * Server Action M04 — Ouvrir / fermer les inscriptions du tournoi actif.
 *
 * Pattern theplayers-server-action-template :
 *  1. requireAdmin (super_admin OU admin)
 *  2. Validation Zod (tournamentId uuid + isOpen boolean)
 *  3. Le tournoi ciblé DOIT être le tournoi actif courant (anti-page-périmée)
 *  4. Update tournaments.is_registrations_open via service_role (RLS bloquante)
 *  5. logActivity (previous / new)
 *  6. revalidatePath des pages impactées (admin + publiques)
 *  7. actionSuccess({ isOpen })
 *
 * NB : action_type est une colonne `string` libre dans activity_log → 'toggle_registrations'.
 */
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { logActivity } from '@/lib/activity/log'
import { requireAdmin } from '@/lib/auth/permissions'
import { getActiveTournamentId } from '@/lib/config/active-tournament'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

const toggleSchema = z.object({
  tournamentId: z.uuid(),
  isOpen: z.boolean(),
})

export interface ToggleRegistrationsInput {
  tournamentId: string
  isOpen: boolean
}

export interface ToggleRegistrationsResult {
  isOpen: boolean
}

export async function toggleRegistrationsAction(
  input: ToggleRegistrationsInput,
): Promise<ActionResult<ToggleRegistrationsResult>> {
  // ─── 1. Auth — admin ou super_admin ─────────────────────────────────
  const session = await requireAdmin()

  // ─── 2. Validation ──────────────────────────────────────────────────
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Données invalides.')
  }
  const { tournamentId, isOpen } = parsed.data

  // ─── 3. Doit cibler le tournoi actif courant ────────────────────────
  const activeId = await getActiveTournamentId()
  if (!activeId || activeId !== tournamentId) {
    return actionError(
      'Ce tournoi n\'est pas le tournoi actif. Rechargez la page.',
    )
  }

  const supabase = createServiceRoleClient()

  // ─── 4a. État précédent (audit + no-op) ─────────────────────────────
  const { data: current, error: readError } = await supabase
    .from('tournaments')
    .select('id, is_registrations_open, is_deleted')
    .eq('id', tournamentId)
    .maybeSingle()

  if (readError) {
    return actionError(`Lecture du tournoi impossible : ${readError.message}`)
  }
  if (!current || current.is_deleted) {
    return actionError('Tournoi introuvable.')
  }
  if (current.is_registrations_open === isOpen) {
    return actionSuccess({ isOpen })
  }

  // ─── 4b. Mise à jour ────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from('tournaments')
    .update({ is_registrations_open: isOpen })
    .eq('id', tournamentId)

  if (updateError) {
    return actionError(`Mise à jour impossible : ${updateError.message}`)
  }

  // ─── 5. Audit log ───────────────────────────────────────────────────
  await logActivity({
    adminId: session.adminId,
    actionType: 'toggle_registrations',
    targetTable: 'tournaments',
    description: isOpen ? 'Inscriptions ouvertes' : 'Inscriptions fermées',
    metadata: {
      tournament_id: tournamentId,
      previous: current.is_registrations_open,
      new: isOpen,
    },
  })

  // ─── 6. Revalidation (admin + pages publiques impactées) ────────────
  revalidatePath('/admin/dashboard')
  revalidatePath('/')
  revalidatePath('/tournoi')
  revalidatePath('/inscription')

  return actionSuccess({ isOpen })
}