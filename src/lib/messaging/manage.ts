import 'server-only'

import { logActivity } from '@/lib/activity/log'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Gestion des messages admin deja envoyes (M12, P3) : modification et
 * suppression DOUCE. Ecriture en service_role (admin = auth custom, hors RLS).
 *
 * Garde-fou : un admin n'agit que sur SES propres messages (`sender_admin_id`).
 * Suppression douce = `is_deleted=true` + `deleted_at` (le message disparait
 * cote joueur via la RLS, mais reste en base pour l'audit). Modification =
 * `edited_at` horodate (marqueur « modifie » visible cote admin).
 */

export interface EditAdminMessageArgs {
  adminId: string
  messageId: string
  subject: string
  body: string
}

export type EditAdminMessageResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'db_error' }

export async function editAdminMessage(
  args: EditAdminMessageArgs,
): Promise<EditAdminMessageResult> {
  const supabase = createServiceRoleClient()

  const { data: msg, error: findError } = await supabase
    .from('messages')
    .select('id, sender_admin_id, is_deleted')
    .eq('id', args.messageId)
    .maybeSingle()

  if (findError) {
    console.error('[editAdminMessage:find]', findError.message)
    return { ok: false, reason: 'db_error' }
  }
  // Seul l'auteur peut modifier, et pas un message deja supprime.
  if (!msg || msg.is_deleted || msg.sender_admin_id !== args.adminId) {
    return { ok: false, reason: 'not_found' }
  }

  const { error } = await supabase
    .from('messages')
    .update({
      subject: args.subject,
      body: args.body,
      edited_at: new Date().toISOString(),
    })
    .eq('id', args.messageId)

  if (error) {
    console.error('[editAdminMessage:update]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  await logActivity({
    adminId: args.adminId,
    actionType: 'edit_message',
    targetTable: 'messages',
    targetId: args.messageId,
    description: `Message modifie : ${args.subject}`,
  })

  return { ok: true }
}

export interface DeleteAdminMessageArgs {
  adminId: string
  messageId: string
}

export type DeleteAdminMessageResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'db_error' }

export async function softDeleteAdminMessage(
  args: DeleteAdminMessageArgs,
): Promise<DeleteAdminMessageResult> {
  const supabase = createServiceRoleClient()

  const { data: msg, error: findError } = await supabase
    .from('messages')
    .select('id, sender_admin_id, is_deleted, subject')
    .eq('id', args.messageId)
    .maybeSingle()

  if (findError) {
    console.error('[softDeleteAdminMessage:find]', findError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!msg || msg.sender_admin_id !== args.adminId) {
    return { ok: false, reason: 'not_found' }
  }
  if (msg.is_deleted) {
    return { ok: true } // Idempotent : deja supprime.
  }

  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', args.messageId)

  if (error) {
    console.error('[softDeleteAdminMessage:update]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  await logActivity({
    adminId: args.adminId,
    actionType: 'delete_message',
    targetTable: 'messages',
    targetId: args.messageId,
    description: `Message supprime : ${msg.subject}`,
  })

  return { ok: true }
}