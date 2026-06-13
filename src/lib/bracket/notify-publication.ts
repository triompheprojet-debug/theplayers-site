import 'server-only'

import { formatTime } from '@/lib/format/dates'
import { logActivity } from '@/lib/activity/log'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { computeArrivalTime, getBracketSettings } from '@/lib/bracket/waves'

import type { Database } from '@/types/database.types'

type MatchRow = Database['public']['Tables']['matches']['Row']

/**
 * Notifications de PUBLICATION du bracket (M14).
 *
 * Émis UNIQUEMENT à la publication (publishBracket, Étape 2), jamais au tirage.
 * Deux canaux par joueur du round 1 :
 *   1. Notification cloche `bracket_published` (temps réel, M13).
 *   2. Message personnel (table `messages`, M12) : adversaire, vague, console
 *      et HEURE D'ARRIVÉE estimée — calculée depuis la config (Règle 11) :
 *      début de la vague du joueur − `bracket.arrival_advance_minutes`.
 *
 * `allow_replies = false` (décision validée). Étanchéité tournoi (Règle 12) :
 * tout est porté par `tournament_id`. Écriture en service_role.
 *
 * Idempotence : à appeler une seule fois (publishBracket garde la transition
 * draft → published). Un second appel recréerait des doublons — l'action
 * appelante est responsable de ne publier qu'une fois.
 *
 * Les `actionUrl*` sont fournis par l'appelant (Étape 2) à partir de `ROUTES`
 * — aucun chemin n'est codé en dur ici.
 */

export interface NotifyPublicationArgs {
  tournamentId: string
  senderAdminId: string
  /** Lien notification cloche → bracket public. Ex. ROUTES.public.bracket */
  bracketActionUrl: string
  /** Lien notification cloche → espace « mon bracket » joueur. Optionnel. */
  playerBracketUrl?: string | null
}

export type NotifyPublicationResult =
  | { ok: true; notifiedPlayers: number; messagesSent: number }
  | {
      ok: false
      reason:
        | 'tournament_not_found'
        | 'missing_config'
        | 'no_matches'
        | 'db_error'
    }

/** Pseudo d'un joueur (affichage dans le message). */
type PseudoMap = Map<string, string>

function describeOpponent(pseudo: string | undefined): string {
  return pseudo && pseudo.length > 0 ? pseudo : 'un adversaire à déterminer'
}

/**
 * Construit le corps du message personnel d'un joueur.
 * Toutes les valeurs proviennent du match (issu de la config) — rien en dur.
 */
function buildPlayerMessage(params: {
  opponentPseudo: string | undefined
  badge: number | null
  consoleNumber: number | null
  waveNumber: number | null
  matchTime: string | null
  arrivalTime: string | null
}): { subject: string; body: string } {
  const lines: string[] = []
  lines.push('Le tirage au sort est publié. Voici les informations de ton premier match :')
  lines.push('')
  lines.push(`Adversaire : ${describeOpponent(params.opponentPseudo)}`)
  if (params.badge != null) lines.push(`Ton badge : n°${params.badge}`)
  if (params.waveNumber != null) lines.push(`Vague : ${params.waveNumber}`)
  if (params.consoleNumber != null) lines.push(`Console : n°${params.consoleNumber}`)
  if (params.matchTime) lines.push(`Heure prévue du match : ${params.matchTime}`)
  lines.push('')
  if (params.arrivalTime) {
    lines.push(
      `Présente-toi sur place à ${params.arrivalTime} au plus tard, muni de ton badge.`,
    )
  }
  return {
    subject: 'Tirage publié — ton premier match',
    body: lines.join('\n'),
  }
}

export async function notifyBracketPublication(
  args: NotifyPublicationArgs,
): Promise<NotifyPublicationResult> {
  const supabase = createServiceRoleClient()

  // 1. Tournoi (config pour la marge d'arrivée — Règle 11)
  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('id, config')
    .eq('id', args.tournamentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (tError) {
    console.error('[notifyBracketPublication:tournament]', tError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!tournament) return { ok: false, reason: 'tournament_not_found' }

  const settings = getBracketSettings(tournament.config)
  if (!settings) return { ok: false, reason: 'missing_config' }

  // 2. Matchs du round 1 (les seuls avec des joueurs et un créneau)
  const { data: matches, error: mError } = await supabase
    .from('matches')
    .select(
      'id, player_a_id, player_b_id, player_a_badge, player_b_badge, console_number, wave_number, scheduled_time',
    )
    .eq('tournament_id', args.tournamentId)
    .eq('round_number', 1)

  if (mError) {
    console.error('[notifyBracketPublication:matches]', mError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!matches || matches.length === 0) {
    return { ok: false, reason: 'no_matches' }
  }

  // 3. Pseudos des joueurs concernés (pour décrire l'adversaire)
  const playerIds = new Set<string>()
  for (const m of matches) {
    if (m.player_a_id) playerIds.add(m.player_a_id)
    if (m.player_b_id) playerIds.add(m.player_b_id)
  }
  const pseudos: PseudoMap = new Map()
  if (playerIds.size > 0) {
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, pseudo')
      .in('id', Array.from(playerIds))

    if (pError) {
      console.error('[notifyBracketPublication:profiles]', pError.message)
      return { ok: false, reason: 'db_error' }
    }
    for (const p of profiles ?? []) {
      if (p.pseudo) pseudos.set(p.id, p.pseudo)
    }
  }

  // 4. Construire notifications + messages par joueur
  type NotifInsert = Database['public']['Tables']['notifications']['Insert']
  type MsgInsert = Database['public']['Tables']['messages']['Insert']

  const notifRows: NotifInsert[] = []
  const msgRows: MsgInsert[] = []

  const sideData = (
    m: (typeof matches)[number],
    side: 'a' | 'b',
  ): {
    playerId: string | null
    badge: number | null
    opponentId: string | null
  } =>
    side === 'a'
      ? {
          playerId: m.player_a_id,
          badge: m.player_a_badge,
          opponentId: m.player_b_id,
        }
      : {
          playerId: m.player_b_id,
          badge: m.player_b_badge,
          opponentId: m.player_a_id,
        }

  for (const m of matches as MatchRow[]) {
    const matchTime = m.scheduled_time ? formatTime(m.scheduled_time) : null
    const arrivalTime = m.scheduled_time
      ? formatTime(computeArrivalTime(m.scheduled_time, settings).toISOString())
      : null

    for (const side of ['a', 'b'] as const) {
      const { playerId, badge, opponentId } = sideData(m, side)
      if (!playerId) continue

      // Notification cloche
      notifRows.push({
        player_id: playerId,
        notification_type: 'bracket_published',
        title: 'Le tirage au sort est publié',
        body: 'Consulte le bracket et les informations de ton premier match.',
        tournament_id: args.tournamentId,
        action_url: args.playerBracketUrl ?? args.bracketActionUrl,
      })

      // Message personnel détaillé
      const { subject, body } = buildPlayerMessage({
        opponentPseudo: opponentId ? pseudos.get(opponentId) : undefined,
        badge,
        consoleNumber: m.console_number,
        waveNumber: m.wave_number,
        matchTime,
        arrivalTime,
      })
      msgRows.push({
        sender_type: 'admin',
        sender_admin_id: args.senderAdminId,
        recipient_player_id: playerId,
        tournament_id: args.tournamentId,
        subject,
        body,
        allow_replies: false,
      })
    }
  }

  // 5. Insertion (notifications puis messages)
  if (notifRows.length > 0) {
    const { error: nErr } = await supabase.from('notifications').insert(notifRows)
    if (nErr) {
      console.error('[notifyBracketPublication:notifications]', nErr.message)
      return { ok: false, reason: 'db_error' }
    }
  }
  if (msgRows.length > 0) {
    const { error: msgErr } = await supabase.from('messages').insert(msgRows)
    if (msgErr) {
      console.error('[notifyBracketPublication:messages]', msgErr.message)
      return { ok: false, reason: 'db_error' }
    }
  }

  await logActivity({
    adminId: args.senderAdminId,
    actionType: 'publish_bracket_notify',
    targetTable: 'matches',
    description: `Notifications de publication du bracket envoyées à ${notifRows.length} joueur(s)`,
    metadata: {
      tournamentId: args.tournamentId,
      notifiedPlayers: notifRows.length,
      messagesSent: msgRows.length,
    },
  })

  return {
    ok: true,
    notifiedPlayers: notifRows.length,
    messagesSent: msgRows.length,
  }
}