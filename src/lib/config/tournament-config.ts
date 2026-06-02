import 'server-only'

import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import type {
  TournamentDefaultsPayment,
  TournamentDefaultsRegistration,
} from '@/types/config.types'

/**
 * Lecture SERVEUR des blocs confidentiels de `tournaments.config`.
 *
 * Ces données (numéros de dépôt MTN/Airtel, montant d'inscription) sont
 * exclues de la RPC publique `get_active_tournament` (Règle 1). Un joueur
 * authentifié et inscrit a le droit de voir les numéros pour payer → on les
 * lit via `getActiveTournamentForAdmin` (service_role), JAMAIS via la RPC
 * publique, et on ne les expose qu'à un joueur authentifié côté Server Component.
 *
 * Règle 11 : aucune valeur en dur — tout vient de la config du tournoi actif.
 */

function asObject<T>(value: unknown): T | null {
  return value && typeof value === 'object' ? (value as T) : null
}

export interface ActivePaymentInfo {
  payment: TournamentDefaultsPayment | null
  registration: TournamentDefaultsRegistration | null
}

/**
 * Récupère, pour le tournoi ACTIF, le bloc `payment` (numéros de dépôt) et
 * `registration` (montant). Renvoie `null` si aucun tournoi actif.
 *
 * À n'appeler que depuis un contexte serveur déjà protégé (joueur authentifié).
 */
export async function getActivePaymentInfo(): Promise<ActivePaymentInfo | null> {
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) return null

  // `config` est un jsonb (type Json). On extrait les sous-blocs typés.
  const config = tournament.config as Record<string, unknown> | null

  return {
    payment: asObject<TournamentDefaultsPayment>(config?.payment),
    registration: asObject<TournamentDefaultsRegistration>(
      config?.registration,
    ),
  }
}