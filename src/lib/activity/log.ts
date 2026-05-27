/**
 * Wrapper d'écriture dans la table `activity_log` (M03).
 *
 * - Utilise service_role (RLS bloquante sur activity_log).
 * - Insert-only, jamais d'UPDATE/DELETE en production.
 * - Capture IP + User-Agent automatiquement depuis next/headers.
 * - JAMAIS de données secrètes dans metadata (PIN, tokens, hash bcrypt).
 *
 * Échec silencieux : si l'INSERT échoue, on log en console et on
 * laisse passer pour ne pas bloquer l'action métier appelante.
 * La perte d'un log d'audit est moins grave qu'un blocage UX.
 */
import 'server-only'

import { headers } from 'next/headers'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

export interface LogActivityInput {
  /** Acteur admin (au moins l'un des deux : adminId ou playerId). */
  adminId?: string | null
  /** Acteur joueur (M06+). */
  playerId?: string | null
  /** Code court de l'action. Ex: 'tournament_created', 'set_active_tournament'. */
  actionType: string
  /** Nom de la table affectée (optionnel). */
  targetTable?: string | null
  /** UUID de la ligne affectée (optionnel). */
  targetId?: string | null
  /** Description libre (optionnel). */
  description?: string | null
  /** Contexte additionnel. JAMAIS de secrets. */
  metadata?: Record<string, unknown>
}

/**
 * Enregistre une entrée d'audit. Ne lève jamais d'exception.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  if (!input.adminId && !input.playerId) {
    console.warn(
      '[activity_log] Tentative d\'enregistrement sans adminId ni playerId — ignoré.',
    )
    return
  }

  try {
    const { ipAddress, userAgent } = await captureRequestContext()
    const supabase = createServiceRoleClient()

    const { error } = await supabase.from('activity_log').insert({
      admin_id: input.adminId ?? null,
      player_id: input.playerId ?? null,
      action_type: input.actionType,
      target_table: input.targetTable ?? null,
      target_id: input.targetId ?? null,
      description: input.description ?? null,
      metadata: (input.metadata ?? {}) as never,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      console.error('[activity_log] Échec INSERT :', error.message)
    }
  } catch (err) {
    console.error('[activity_log] Exception inattendue :', err)
  }
}

/**
 * Récupère IP + User-Agent depuis les headers Next.
 * Tolérant : renvoie null pour chaque valeur si non disponible
 * (ex: appel hors contexte de requête, jobs cron).
 */
async function captureRequestContext(): Promise<{
  ipAddress: string | null
  userAgent: string | null
}> {
  try {
    const h = await headers()
    // Ordre standard pour récupérer l'IP réelle derrière proxies / CDN Vercel
    const forwarded = h.get('x-forwarded-for')
    const realIp = h.get('x-real-ip')
    const ipAddress =
      forwarded?.split(',')[0]?.trim() || realIp || null
    const userAgent = h.get('user-agent') || null
    return { ipAddress, userAgent }
  } catch {
    return { ipAddress: null, userAgent: null }
  }
}
