import type { Database } from '@/types/database.types'

/**
 * Helpers des méthodes de paiement (M09).
 *
 * Règle 3 — terminologie STRICTE : « MTN Mobile Money », « Airtel Money »,
 * « Espèces ». Les valeurs enum (mtn_mobile_money / airtel_money / cash)
 * proviennent de la migration 01.
 */
export type PaymentMethod = Database['public']['Enums']['payment_method']

/** Libellés affichables exacts (Règle 3). */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mtn_mobile_money: 'MTN Mobile Money',
  airtel_money: 'Airtel Money',
  cash: 'Espèces',
}

/** Méthodes mobile money (référence de transaction obligatoire). */
export const MOBILE_MONEY_METHODS: readonly PaymentMethod[] = [
  'mtn_mobile_money',
  'airtel_money',
] as const

/** `true` si la méthode exige une référence de transaction (≠ cash). */
export function requiresTransactionRef(method: PaymentMethod): boolean {
  return method !== 'cash'
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method]
}