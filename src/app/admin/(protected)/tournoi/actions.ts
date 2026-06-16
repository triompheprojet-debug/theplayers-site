'use server'

/**
 * Server Actions M14 — Gestion du bracket (admin).
 *
 * Pattern theplayers-server-action-template :
 *  1. requireAdminRole(['super_admin','admin']) — referee exclu du tirage/publi
 *  2. Validation Zod / contrôle "tournoi actif courant" (anti-page-périmée)
 *  3. Délégation à la logique métier (lib/bracket/*)
 *  4. logActivity (fait dans la couche lib pour publish/notify)
 *  5. revalidatePath des pages impactées
 *  6. actionSuccess / actionError
 *
 * Toutes les écritures passent par service_role dans la couche lib (RLS
 * bloquante sur matches). Les liens de notification proviennent de ROUTES.
 */
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity/log'
import { requireAdminRole } from '@/lib/auth/permissions'
import { drawBracket } from '@/lib/bracket/draw'
import { publishBracket, unpublishBracket } from '@/lib/bracket/publish'
import { submitMatchScore } from '@/lib/bracket/submit-score'
import { recomputeSeasonStandingsForTournament } from '@/lib/standings/season-standings'
import {
  computeTournamentStandings,
  type PendingTieBreak,
} from '@/lib/standings/tournament-standings'
import { getActiveTournamentId } from '@/lib/config/active-tournament'
import { ROUTES } from '@/config/routes'
import {
  matchForfeitSchema,
  matchScoreSchema,
} from '@/lib/validation/match'
import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'

const ADMIN_ROLES = ['super_admin', 'admin'] as const

/** Vérifie que la cible est bien le tournoi actif courant. */
async function assertActiveTournament(
  tournamentId: string,
): Promise<string | null> {
  const activeId = await getActiveTournamentId()
  if (!activeId || activeId !== tournamentId) {
    return 'Ce tournoi n\'est pas le tournoi actif. Rechargez la page.'
  }
  return null
}

function revalidateBracketPages() {
  revalidatePath(ROUTES.admin.tournament)
  revalidatePath(ROUTES.bracket)
  revalidatePath(ROUTES.player.bracket)
  revalidatePath(ROUTES.referee.bracket)
}

// ===========================================================================
// 1. Tirage au sort
// ===========================================================================

export interface DrawBracketResultData {
  playerCount: number
  byeCount: number
  matchCount: number
  rounds: number
}

const DRAW_ERROR_MESSAGES: Record<string, string> = {
  tournament_not_found: 'Tournoi introuvable.',
  already_drawn:
    'Le tirage a déjà été effectué pour ce tournoi. Il ne peut pas être relancé.',
  not_enough_players:
    'Pas assez de joueurs confirmés pour générer un bracket (minimum 2).',
  missing_config:
    'Configuration du tournoi incomplète (consoles, durée de match ou heure de début du bracket).',
  db_error: 'Une erreur est survenue lors du tirage.',
}

export async function drawBracketAction(
  tournamentId: string,
): Promise<ActionResult<DrawBracketResultData>> {
  const session = await requireAdminRole(ADMIN_ROLES)

  const activeError = await assertActiveTournament(tournamentId)
  if (activeError) return actionError(activeError)

  const result = await drawBracket(tournamentId)
  if (!result.ok) {
    return actionError(DRAW_ERROR_MESSAGES[result.reason] ?? 'Tirage impossible.')
  }

  await logActivity({
    adminId: session.adminId,
    actionType: 'draw_bracket',
    targetTable: 'matches',
    description: `Tirage au sort effectué (${result.summary.playerCount} joueurs, ${result.summary.matchCount} matchs)`,
    metadata: { tournamentId, ...result.summary },
  })

  revalidateBracketPages()
  return actionSuccess(result.summary)
}

// ===========================================================================
// 2. Publication / dépublication
// ===========================================================================

export interface PublishBracketResultData {
  alreadyPublished: boolean
  notifiedPlayers: number
  messagesSent: number
}

const PUBLISH_ERROR_MESSAGES: Record<string, string> = {
  tournament_not_found: 'Tournoi introuvable.',
  no_bracket: 'Aucun bracket à publier : effectuez d\'abord le tirage.',
  missing_config: 'Configuration du tournoi incomplète.',
  no_matches: 'Aucun match du premier tour à notifier.',
  db_error: 'Une erreur est survenue lors de la publication.',
}

export async function publishBracketAction(
  tournamentId: string,
): Promise<ActionResult<PublishBracketResultData>> {
  const session = await requireAdminRole(ADMIN_ROLES)

  const activeError = await assertActiveTournament(tournamentId)
  if (activeError) return actionError(activeError)

  const result = await publishBracket({
    tournamentId,
    senderAdminId: session.adminId,
    bracketActionUrl: ROUTES.bracket,
    playerBracketUrl: ROUTES.player.bracket,
  })

  if (!result.ok) {
    return actionError(
      PUBLISH_ERROR_MESSAGES[result.reason] ?? 'Publication impossible.',
    )
  }

  revalidateBracketPages()
  return actionSuccess({
    alreadyPublished: result.alreadyPublished,
    notifiedPlayers: result.notifiedPlayers,
    messagesSent: result.messagesSent,
  })
}

export async function unpublishBracketAction(
  tournamentId: string,
): Promise<ActionResult<{ unpublished: true }>> {
  const session = await requireAdminRole(ADMIN_ROLES)

  const activeError = await assertActiveTournament(tournamentId)
  if (activeError) return actionError(activeError)

  const result = await unpublishBracket(tournamentId, session.adminId)
  if (!result.ok) {
    return actionError('Impossible de repasser le bracket en brouillon.')
  }

  revalidateBracketPages()
  return actionSuccess({ unpublished: true })
}

// ===========================================================================
// 3. Saisie de score / forfait
// ===========================================================================

export interface SubmitScoreInput {
  matchId: string
  scoreA: number
  scoreB: number
}

export interface SubmitScoreResultData {
  status: 'completed' | 'forfeit'
  nextAlreadyPlayed: boolean
}

const SCORE_ERROR_MESSAGES: Record<string, string> = {
  match_not_found: 'Match introuvable.',
  players_missing: 'Les deux joueurs ne sont pas encore déterminés pour ce match.',
  match_cancelled: 'Ce match est annulé.',
  invalid_scores: 'Scores invalides.',
  draw_not_allowed:
    'Match nul impossible en élimination directe : il faut un vainqueur.',
  invalid_forfeit_player: 'Le joueur déclarant forfait est invalide.',
  db_error: 'Une erreur est survenue lors de la saisie.',
}

export async function submitScoreAction(
  input: SubmitScoreInput,
): Promise<ActionResult<SubmitScoreResultData>> {
  const session = await requireAdminRole(ADMIN_ROLES)

  const parsed = matchScoreSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return actionError('Scores invalides.', fieldErrors as Record<string, string[]>)
  }

  const result = await submitMatchScore({
    matchId: parsed.data.matchId,
    scoredBy: session.adminId,
    scoreA: parsed.data.scoreA,
    scoreB: parsed.data.scoreB,
  })

  if (!result.ok) {
    return actionError(SCORE_ERROR_MESSAGES[result.reason] ?? 'Saisie impossible.')
  }

  await logActivity({
    adminId: session.adminId,
    actionType: 'submit_score',
    targetTable: 'matches',
    targetId: parsed.data.matchId,
    description: `Score saisi : ${parsed.data.scoreA}-${parsed.data.scoreB}`,
    metadata: {
      matchId: parsed.data.matchId,
      scoreA: parsed.data.scoreA,
      scoreB: parsed.data.scoreB,
      nextAlreadyPlayed: result.nextAlreadyPlayed,
    },
  })

  revalidateBracketPages()
  return actionSuccess({
    status: result.status,
    nextAlreadyPlayed: result.nextAlreadyPlayed,
  })
}

export interface SubmitForfeitInput {
  matchId: string
  forfeitPlayerId: string
  forfeitReason?: string
}

export async function submitForfeitAction(
  input: SubmitForfeitInput,
): Promise<ActionResult<SubmitScoreResultData>> {
  const session = await requireAdminRole(ADMIN_ROLES)

  const parsed = matchForfeitSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return actionError(
      'Déclaration de forfait invalide.',
      fieldErrors as Record<string, string[]>,
    )
  }

  const result = await submitMatchScore({
    matchId: parsed.data.matchId,
    scoredBy: session.adminId,
    forfeitPlayerId: parsed.data.forfeitPlayerId,
    forfeitReason: parsed.data.forfeitReason,
  })

  if (!result.ok) {
    return actionError(SCORE_ERROR_MESSAGES[result.reason] ?? 'Saisie impossible.')
  }

  await logActivity({
    adminId: session.adminId,
    actionType: 'submit_forfeit',
    targetTable: 'matches',
    targetId: parsed.data.matchId,
    description: 'Forfait déclaré',
    metadata: {
      matchId: parsed.data.matchId,
      forfeitPlayerId: parsed.data.forfeitPlayerId,
      nextAlreadyPlayed: result.nextAlreadyPlayed,
    },
  })

  revalidateBracketPages()
  return actionSuccess({
    status: result.status,
    nextAlreadyPlayed: result.nextAlreadyPlayed,
  })
}
// ===========================================================================
// 5. Classement final (M16) — calcul + départage manuel 3ᵉ/4ᵉ
// ===========================================================================

export type ComputeStandingsActionData =
  | { finalized: true; standingsCount: number }
  | { finalized: false; pendingTieBreak: PendingTieBreak }

const STANDINGS_ERROR_MESSAGES: Record<string, string> = {
  tournament_not_found: 'Tournoi introuvable.',
  no_bracket: "Aucun bracket : effectuez d'abord le tirage.",
  not_finished:
    "Le tournoi n'est pas terminé : chaque match doit avoir un vainqueur.",
  invalid_bracket: 'Structure de bracket inattendue.',
  db_error: 'Une erreur est survenue lors du calcul du classement.',
}

function revalidateStandingsPages() {
  revalidatePath(ROUTES.admin.tournament)
  revalidatePath(ROUTES.ranking)
  revalidatePath(ROUTES.player.ranking)
}

/**
 * Calcule et fige le classement final du tournoi actif. Si les 3ᵉ/4ᵉ ne peuvent
 * être départagés automatiquement (égalité stricte en demi), renvoie la paire à
 * trancher (`finalized: false`). Pour un tournoi de saison, recalcule ensuite le
 * classement cumulé.
 */
export async function computeTournamentStandingsAction(
  tournamentId: string,
): Promise<ActionResult<ComputeStandingsActionData>> {
  const session = await requireAdminRole(ADMIN_ROLES)

  const activeError = await assertActiveTournament(tournamentId)
  if (activeError) return actionError(activeError)

  const result = await computeTournamentStandings(tournamentId)
  if (!result.ok) {
    return actionError(
      STANDINGS_ERROR_MESSAGES[result.reason] ?? 'Calcul impossible.',
    )
  }

  if (!result.finalized) {
    return actionSuccess({
      finalized: false,
      pendingTieBreak: result.pendingTieBreak,
    })
  }

  const season = await recomputeSeasonStandingsForTournament(tournamentId)

  await logActivity({
    adminId: session.adminId,
    actionType: 'compute_standings',
    targetTable: 'tournament_standings',
    targetId: tournamentId,
    description: `Classement calculé (${result.standingsCount} joueurs)`,
    metadata: {
      tournamentId,
      standingsCount: result.standingsCount,
      seasonRecomputed: season.ok && season.recomputed,
      qualifiedCount:
        season.ok && season.recomputed ? season.qualifiedCount : null,
    },
  })

  revalidateStandingsPages()
  return actionSuccess({
    finalized: true,
    standingsCount: result.standingsCount,
  })
}

/**
 * Tranche manuellement le 3ᵉ/4ᵉ en cas d'égalité stricte, puis fige le
 * classement. `thirdPlacePlayerId` doit être l'un des deux perdants de demi.
 */
export async function resolveThirdPlaceAction(
  tournamentId: string,
  thirdPlacePlayerId: string,
): Promise<ActionResult<ComputeStandingsActionData>> {
  const session = await requireAdminRole(ADMIN_ROLES)

  const activeError = await assertActiveTournament(tournamentId)
  if (activeError) return actionError(activeError)

  const result = await computeTournamentStandings(tournamentId, {
    thirdPlacePlayerId,
  })
  if (!result.ok) {
    return actionError(
      STANDINGS_ERROR_MESSAGES[result.reason] ?? 'Calcul impossible.',
    )
  }
  if (!result.finalized) {
    return actionError('Le joueur choisi pour la 3ᵉ place est invalide.')
  }

  await recomputeSeasonStandingsForTournament(tournamentId)
 
  await logActivity({
    adminId: session.adminId,
    actionType: 'resolve_third_place',
    targetTable: 'tournament_standings',
    targetId: tournamentId,
    description: 'Départage 3ᵉ/4ᵉ tranché manuellement',
    metadata: {
      tournamentId,
      thirdPlacePlayerId,
      standingsCount: result.standingsCount,
    },
  })

  revalidateStandingsPages()
  return actionSuccess({
    finalized: true,
    standingsCount: result.standingsCount,
  })
}