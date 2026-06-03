'use server'

import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity/log'
import { hasPermission } from '@/lib/auth/permissions'
import { getAdminSession } from '@/lib/auth/session'
import { generateDocumentForRegistration } from '@/lib/documents/generate-pdf'
import { createDocumentSignedUrl } from '@/lib/documents/signed-url'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import type { ActionResult } from '@/types/api.types'

const ADMIN_DOCS_PATH = '/admin/documents'

/**
 * (Re)génère le document officiel d'une inscription confirmée (M11).
 * Délègue au crochet `generateDocumentForRegistration` (lib). Journalisé.
 */
export async function generateDocument(
  registrationId: string,
): Promise<ActionResult<{ documentId: string }>> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: 'Session admin requise' }
  if (!hasPermission(session.role, ['super_admin', 'admin'])) {
    return { success: false, error: 'Permission insuffisante' }
  }

  const res = await generateDocumentForRegistration(registrationId, {
    generatedByAdminId: session.adminId,
  })
  if (!res.ok) {
    console.error('[generateDocument]', res.reason)
    return { success: false, error: `Génération impossible (${res.reason})` }
  }

  await logActivity({
    adminId: session.adminId,
    actionType: 'document_generated',
    targetTable: 'documents',
    targetId: res.documentId,
    description: 'Document officiel (re)généré.',
    metadata: { registration_id: registrationId },
  })

  revalidatePath(ADMIN_DOCS_PATH)
  return { success: true, data: { documentId: res.documentId } }
}

/**
 * URL signée courte (5 min) pour qu'un admin télécharge un document.
 */
export async function getDocumentUrl(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: 'Session admin requise' }
  if (!hasPermission(session.role, ['super_admin', 'admin', 'referee'])) {
    return { success: false, error: 'Permission insuffisante' }
  }

  const supabase = createServiceRoleClient()
  const { data: doc, error } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle()

  if (error || !doc) return { success: false, error: 'Document introuvable' }

  const url = await createDocumentSignedUrl(doc.storage_path, 300)
  if (!url) return { success: false, error: 'Lien indisponible' }
  return { success: true, data: { url } }
}

/**
 * Régénère TOUS les documents des inscriptions confirmées du tournoi actif
 * (ex. après régénération de la clé QR). Réservé au SUPER_ADMIN. Séquentiel
 * pour rester prévisible ; journalise un récapitulatif.
 */
export async function regenerateAll(): Promise<
  ActionResult<{ generated: number; failed: number }>
> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: 'Session admin requise' }
  if (!hasPermission(session.role, ['super_admin'])) {
    return { success: false, error: 'Réservé au SUPER_ADMIN' }
  }

  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) return { success: false, error: 'Aucun tournoi actif' }

  const supabase = createServiceRoleClient()
  const { data: regs, error } = await supabase
    .from('registrations')
    .select('id')
    .eq('tournament_id', tournament.id)
    .eq('status', 'confirmed')
    .not('badge_number', 'is', null)

  if (error) {
    console.error('[regenerateAll]', error.message)
    return { success: false, error: 'Erreur de lecture des inscriptions' }
  }

  let generated = 0
  let failed = 0
  for (const reg of regs ?? []) {
    const res = await generateDocumentForRegistration(reg.id, {
      generatedByAdminId: session.adminId,
    })
    if (res.ok) generated += 1
    else failed += 1
  }

  await logActivity({
    adminId: session.adminId,
    actionType: 'documents_regenerated_all',
    targetTable: 'documents',
    targetId: tournament.id,
    description: `Régénération globale (${generated} ok, ${failed} échecs).`,
    metadata: { tournament_id: tournament.id, generated, failed },
  })

  revalidatePath(ADMIN_DOCS_PATH)
  return { success: true, data: { generated, failed } }
}