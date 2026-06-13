import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Filet de sécurité (M14) : wrapper de la RPC `advance_winner_in_bracket`.
 *
 * L'avancement NORMAL du vainqueur est fait automatiquement par le trigger
 * trg_matches_advance_winner. Ce wrapper sert uniquement aux cas de
 * réparation manuelle admin (ex. resynchroniser un slot après une correction
 * en cascade). Appel en service_role : la fonction SQL est REVOKE pour
 * anon/authenticated.
 */
export type AdvanceWinnerResult =
  | { ok: true }
  | { ok: false; reason: 'db_error' }

export async function advanceWinner(
  matchId: string,
): Promise<AdvanceWinnerResult> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase.rpc('advance_winner_in_bracket', {
    p_match_id: matchId,
  })

  if (error) {
    console.error('[advanceWinner]', error.message)
    return { ok: false, reason: 'db_error' }
  }
  return { ok: true }
}