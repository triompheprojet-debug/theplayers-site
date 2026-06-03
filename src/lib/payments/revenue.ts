import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

import type { Database } from '@/types/database.types'

type PaymentMethod = Database['public']['Enums']['payment_method']

/**
 * Revenus confirmés d'un tournoi (M10) — option service_role, zéro migration.
 *
 * Somme des `payments.amount_fcfa` au statut `confirmed`, avec ventilation par
 * méthode (MTN / Airtel / Espèces). Seuls les paiements confirmés comptent ;
 * `pending` et `rejected` sont exclus. Aucune notion de remboursement (Règle 9).
 */
export interface RevenueBreakdown {
  total: number
  mtn: number
  airtel: number
  cash: number
  confirmedCount: number
}

const EMPTY: RevenueBreakdown = {
  total: 0,
  mtn: 0,
  airtel: 0,
  cash: 0,
  confirmedCount: 0,
}

export async function getConfirmedRevenue(
  tournamentId: string,
): Promise<RevenueBreakdown> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('payments')
    .select('method, amount_fcfa')
    .eq('tournament_id', tournamentId)
    .eq('status', 'confirmed')

  if (error) {
    console.error('[getConfirmedRevenue]', error.message)
    return { ...EMPTY }
  }

  return (data ?? []).reduce<RevenueBreakdown>((acc, row) => {
    const amount = row.amount_fcfa
    acc.total += amount
    acc.confirmedCount += 1
    const method = row.method as PaymentMethod
    if (method === 'mtn_mobile_money') acc.mtn += amount
    else if (method === 'airtel_money') acc.airtel += amount
    else if (method === 'cash') acc.cash += amount
    return acc
  }, { ...EMPTY })
}