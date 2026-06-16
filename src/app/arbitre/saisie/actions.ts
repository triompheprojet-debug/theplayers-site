'use server'

/**
 * Server Action — Saisie de score par l'arbitre (M15).
 *
 * Réutilise le CŒUR PARTAGÉ M14 `submitMatchScore` (src/lib/bracket/submit-score.ts) :
 * l'avancement du vainqueur au tour suivant est fait par le TRIGGER SQL
 * `trg_matches_advance_winner`, jamais ici (zéro duplication).
 *
 * Rôles autorisés : super_admin, admin, referee (auth admin custom).
 * `scoredBy` = compte connecté (jamais fourni par le client).
 * Validation Zod côté serveur (matchScoreSchema / matchForfeitSchema).
 */
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity/log'
import { requireAdminRole } from '@/lib/auth/permissions'
import {
  submitMatchScore,
  type SubmitScoreResult,
} from '@/lib/bracket/submit-score'
import { matchForfeitSchema, matchScoreSchema } from '@/lib/validation/match'
import { ROUTES } from '@/config/routes'
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from '@/types/api.types'

export type SubmitScoreActionInput =
  | { mode: 'score'; matchId: string; scoreA: number; scoreB: number }
  | {
      mode: 'forfeit'
      matchId: string
      forfeitPlayerId: string
      forfeitReason?: string
    }

export interface SubmitScoreActionData {
  winnerId: string
  status: 'completed' | 'forfeit'
  /** Le match suivant était déjà joué → correction en cascade à faire à la main (avertissement). */
  nextAlreadyPlayed: boolean
}

const REASON_MESSAGES: Record<string, string> = {
  match_not_found: 'Match introuvable.',
  players_missing: 'Les deux joueurs ne sont pas encore connus pour ce match.',
  match_cancelled: 'Ce match a été annulé.',
  invalid_scores: 'Scores invalides.',
  draw_not_allowed: 'Match nul impossible : il faut un vainqueur.',
  invalid_forfeit_player: 'Joueur déclarant forfait invalide.',
  db_error: 'Erreur technique. Réessaie.',
}

export async function submitMatchScoreAction(
  input: SubmitScoreActionInput,
): Promise<ActionResult<SubmitScoreActionData>> {
  const session = await requireAdminRole(['super_admin', 'admin', 'referee'])

  let result: SubmitScoreResult

  if (input.mode === 'score') {
    const parsed = matchScoreSchema.safeParse({
      matchId: input.matchId,
      scoreA: input.scoreA,
      scoreB: input.scoreB,
    })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return actionError(first?.message ?? 'Scores invalides.')
    }
    result = await submitMatchScore({
      matchId: parsed.data.matchId,
      scoredBy: session.adminId,
      scoreA: parsed.data.scoreA,
      scoreB: parsed.data.scoreB,
    })
  } else {
    const parsed = matchForfeitSchema.safeParse({
      matchId: input.matchId,
      forfeitPlayerId: input.forfeitPlayerId,
      forfeitReason: input.forfeitReason,
    })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return actionError(first?.message ?? 'Forfait invalide.')
    }
    result = await submitMatchScore({
      matchId: parsed.data.matchId,
      scoredBy: session.adminId,
      forfeitPlayerId: parsed.data.forfeitPlayerId,
      forfeitReason: parsed.data.forfeitReason,
    })
  }

  if (!result.ok) {
    return actionError(REASON_MESSAGES[result.reason] ?? 'Erreur inattendue.')
  }

  await logActivity({
    adminId: session.adminId,
    actionType: 'submit_match_score',
    targetTable: 'matches',
    targetId: input.matchId,
    description: `Score saisi (${result.status})`,
    metadata: {
      status: result.status,
      winnerId: result.winnerId,
      nextAlreadyPlayed: result.nextAlreadyPlayed,
      via: 'referee',
    },
  })

  // Le vainqueur a avancé via le trigger : rafraîchir tous les espaces qui
  // affichent le bracket.
  for (const path of [
    ROUTES.referee.scoreEntry,
    ROUTES.referee.matches,
    ROUTES.referee.bracket,
    ROUTES.admin.tournament,
    ROUTES.bracket,
    ROUTES.player.bracket,
  ]) {
    revalidatePath(path)
  }

  return actionSuccess({
    winnerId: result.winnerId,
    status: result.status,
    nextAlreadyPlayed: result.nextAlreadyPlayed,
  })
}