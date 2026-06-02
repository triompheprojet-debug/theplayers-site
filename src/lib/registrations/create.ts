import 'server-only'

import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Résultat métier d'une tentative de réservation.
 * Les motifs sont des codes stables → la couche Server Action les traduit en
 * messages utilisateur. On n'expose JAMAIS la capacité (Règle 1).
 */
export type CreateReservationResult =
  | { ok: true; registrationId: string }
  | {
      ok: false
      reason:
        | 'no_active_tournament'
        | 'registrations_closed'
        | 'tournament_full'
        | 'already_registered'
        | 'db_error'
    }

/**
 * Crée une inscription `reserved` pour le joueur sur le tournoi ACTIF.
 *
 * Écrit en service_role (RLS maîtrisée) car le contrôle « tournoi complet »
 * nécessite de lire `capacity` (confidentiel) et de compter les inscriptions —
 * impossible sous la RLS joueur. La capacité n'est jamais renvoyée à l'appelant.
 *
 * Contrôles :
 *   1. Un tournoi actif existe.
 *   2. Ses inscriptions sont ouvertes (is_registrations_open).
 *   3. Le tournoi n'est pas complet (count actives < capacity), sans exposer
 *      le chiffre.
 *   4. Le joueur n'est pas déjà inscrit (contrainte unique en dernier rempart).
 *
 * `badge_number` reste NULL : il est attribué à la confirmation (trigger M08).
 */
export async function createReservedRegistration(
  playerId: string,
): Promise<CreateReservationResult> {
  // 1. Tournoi actif (version admin : capacity visible côté serveur uniquement)
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) return { ok: false, reason: 'no_active_tournament' }

  // 2. Inscriptions ouvertes
  if (!tournament.is_registrations_open) {
    return { ok: false, reason: 'registrations_closed' }
  }

  const supabase = createServiceRoleClient()

  // 3. Contrôle de capacité — sans jamais exposer le chiffre (Règle 1).
  //    On compte les inscriptions « actives » (places occupées ou en cours).
  if (tournament.capacity != null) {
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)
      .in('status', ['reserved', 'awaiting_verification', 'confirmed'])

    if (countError) {
      console.error('[createReservedRegistration:count]', countError.message)
      return { ok: false, reason: 'db_error' }
    }
    if (count != null && count >= tournament.capacity) {
      return { ok: false, reason: 'tournament_full' }
    }
  }

  // 4. Insertion (status forcé reserved, badge NULL, origine online)
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      tournament_id: tournament.id,
      player_id: playerId,
      status: 'reserved',
      registered_via: 'online',
    })
    .select('id')
    .single()

  if (error) {
    // 23505 = violation de contrainte unique → déjà inscrit
    if (error.code === '23505') {
      return { ok: false, reason: 'already_registered' }
    }
    console.error('[createReservedRegistration:insert]', error.message)
    return { ok: false, reason: 'db_error' }
  }

  return { ok: true, registrationId: data.id }
}

/**
 * Récupère l'inscription du joueur pour le tournoi ACTIF (ou null).
 * Lecture en service_role pour rester utilisable depuis des fonctions cachées
 * (`unstable_cache` interdit `cookies()`), et pour un comptage cohérent.
 */
export async function getPlayerRegistrationForActive(
  playerId: string,
): Promise<{
  id: string
  status: string
  badge_number: number | null
} | null> {
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) return null

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('id, status, badge_number')
    .eq('tournament_id', tournament.id)
    .eq('player_id', playerId)
    .maybeSingle()

  if (error) {
    console.error('[getPlayerRegistrationForActive]', error.message)
    return null
  }
  return data
}