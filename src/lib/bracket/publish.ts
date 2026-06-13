import 'server-only'

import { logActivity } from '@/lib/activity/log'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { notifyBracketPublication } from '@/lib/bracket/notify-publication'

/**
 * Publication / dépublication du bracket (M14).
 *
 * - `publish` : passe `bracket_visibility` de 'draft' à 'published' UNE SEULE
 *   fois (garde sur la transition), puis déclenche les notifications joueurs
 *   (cloche + message personnel avec heure d'arrivée). La garde empêche les
 *   doublons de notifications si l'admin reclique.
 * - `unpublish` : repasse à 'draft' (le bracket disparaît des vues publiques).
 *   N'émet aucune notification, ne supprime aucun message déjà envoyé.
 *
 * Écriture en service_role. Les liens de notification proviennent de l'appelant
 * (Server Action, depuis ROUTES) — aucun chemin en dur ici.
 */

export interface PublishBracketArgs {
  tournamentId: string
  senderAdminId: string
  bracketActionUrl: string
  playerBracketUrl?: string | null
}

export type PublishBracketResult =
  | {
      ok: true
      alreadyPublished: boolean
      notifiedPlayers: number
      messagesSent: number
    }
  | {
      ok: false
      reason:
        | 'tournament_not_found'
        | 'no_bracket'
        | 'missing_config'
        | 'no_matches'
        | 'db_error'
    }

export async function publishBracket(
  args: PublishBracketArgs,
): Promise<PublishBracketResult> {
  const supabase = createServiceRoleClient()

  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('id, bracket_visibility')
    .eq('id', args.tournamentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (tError) {
    console.error('[publishBracket:tournament]', tError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!tournament) return { ok: false, reason: 'tournament_not_found' }

  // Garde : un bracket doit exister (au moins un match)
  const { count, error: cError } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', args.tournamentId)

  if (cError) {
    console.error('[publishBracket:guard]', cError.message)
    return { ok: false, reason: 'db_error' }
  }
  if ((count ?? 0) === 0) return { ok: false, reason: 'no_bracket' }

  // Déjà publié → idempotent, pas de re-notification
  if (tournament.bracket_visibility === 'published') {
    return {
      ok: true,
      alreadyPublished: true,
      notifiedPlayers: 0,
      messagesSent: 0,
    }
  }

  // Transition draft → published
  const { error: uError } = await supabase
    .from('tournaments')
    .update({ bracket_visibility: 'published' })
    .eq('id', args.tournamentId)

  if (uError) {
    console.error('[publishBracket:update]', uError.message)
    return { ok: false, reason: 'db_error' }
  }

  // Notifications (cloche + messages personnels)
  const notif = await notifyBracketPublication({
    tournamentId: args.tournamentId,
    senderAdminId: args.senderAdminId,
    bracketActionUrl: args.bracketActionUrl,
    playerBracketUrl: args.playerBracketUrl ?? null,
  })

  await logActivity({
    adminId: args.senderAdminId,
    actionType: 'publish_bracket',
    targetTable: 'tournaments',
    targetId: args.tournamentId,
    description: 'Bracket publié',
    metadata: {
      tournamentId: args.tournamentId,
      notify: notif.ok ? notif : { failed: true, reason: notif.reason },
    },
  })

  if (!notif.ok) {
    // Le bracket EST publié ; seules les notifs ont échoué. On le signale
    // sans annuler la publication (l'admin peut renotifier manuellement).
    return {
      ok: true,
      alreadyPublished: false,
      notifiedPlayers: 0,
      messagesSent: 0,
    }
  }

  return {
    ok: true,
    alreadyPublished: false,
    notifiedPlayers: notif.notifiedPlayers,
    messagesSent: notif.messagesSent,
  }
}

export type UnpublishBracketResult =
  | { ok: true }
  | { ok: false; reason: 'db_error' }

export async function unpublishBracket(
  tournamentId: string,
  senderAdminId: string,
): Promise<UnpublishBracketResult> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('tournaments')
    .update({ bracket_visibility: 'draft' })
    .eq('id', tournamentId)
    .eq('is_deleted', false)

  if (error) {
    console.error('[unpublishBracket]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  await logActivity({
    adminId: senderAdminId,
    actionType: 'unpublish_bracket',
    targetTable: 'tournaments',
    targetId: tournamentId,
    description: 'Bracket repassé en brouillon',
    metadata: { tournamentId },
  })

  return { ok: true }
}