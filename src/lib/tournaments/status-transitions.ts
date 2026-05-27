/**
 * Matrice des transitions autorisées sur `tournaments.status`.
 *
 * Cycle nominal :
 *   draft → registrations_open → registrations_closed → in_progress → completed → archived
 *
 * Autorisations exceptionnelles (admin) :
 *   - retour en arrière depuis registrations_open vers draft (annulation)
 *   - retour en arrière depuis registrations_closed vers registrations_open (rouvrir)
 *   - archived est terminal (pas de retour)
 *   - n'importe quel état non-terminal peut basculer vers archived (abandon)
 *
 * La validation de ces transitions est appliquée dans les Server Actions
 * (M04+) avant tout UPDATE.
 */
import 'server-only'

import type { Database } from '@/types/database.types'

export type TournamentStatus =
  Database['public']['Enums']['tournament_status']

/**
 * Map : statut courant → ensemble des statuts cibles autorisés.
 */
const ALLOWED_TRANSITIONS: Record<TournamentStatus, ReadonlySet<TournamentStatus>> = {
  draft: new Set(['registrations_open', 'archived']),
  registrations_open: new Set([
    'registrations_closed',
    'draft',
    'archived',
  ]),
  registrations_closed: new Set([
    'in_progress',
    'registrations_open',
    'archived',
  ]),
  in_progress: new Set(['completed', 'archived']),
  completed: new Set(['archived']),
  archived: new Set(), // terminal
}

/**
 * Vérifie si la transition `from → to` est autorisée.
 * Cas particulier : `from === to` est toujours autorisé (no-op).
 */
export function canTransitionStatus(
  from: TournamentStatus,
  to: TournamentStatus,
): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from].has(to)
}

/**
 * Liste les transitions possibles depuis un état (utile pour l'UI :
 * désactiver les boutons non autorisés).
 */
export function listAllowedTransitions(
  from: TournamentStatus,
): TournamentStatus[] {
  return Array.from(ALLOWED_TRANSITIONS[from])
}

/**
 * Erreur typée pour les Server Actions.
 */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: TournamentStatus,
    public readonly to: TournamentStatus,
  ) {
    super(
      `Transition de statut interdite : "${from}" → "${to}". ` +
        `Transitions autorisées depuis "${from}" : ${
          listAllowedTransitions(from).join(', ') || '(aucune — terminal)'
        }.`,
    )
    this.name = 'InvalidTransitionError'
  }
}