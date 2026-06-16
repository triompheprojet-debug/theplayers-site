import { CalendarClock, Trophy } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { getActiveConsoleCount } from '@/lib/bracket/consoles'
import { getAdminBracket } from '@/lib/bracket/read'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { ScoreEntryBoard } from './components/ScoreEntryBoard'

import type { Json } from '@/types/database.types'

/**
 * Écran principal arbitre (jour J) : sélection d'un match jouable du tournoi
 * actif (scheduled / in_progress) et saisie du score ou d'un forfait.
 *
 * Lecture admin du bracket (service_role, pseudos joints). Les valeurs de
 * config (nombre de consoles, durée de match) viennent EXCLUSIVEMENT de
 * `tournaments.config` (Règle 11) — aucune valeur en dur.
 */
export default async function ScoreEntryPage() {
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucun tournoi actif"
        description="Aucune saisie possible tant qu'un tournoi n'est pas défini comme actif."
      />
    )
  }

  const bracket = await getAdminBracket(tournament.id)
  if (!bracket || !bracket.hasBracket) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Bracket pas encore tiré"
        description="Le tableau des matchs n'a pas encore été généré par l'administrateur."
      />
    )
  }

  const playable = bracket.matches.filter(
    (m) =>
      (m.status === 'scheduled' || m.status === 'in_progress') &&
      m.playerAId !== null &&
      m.playerBId !== null,
  )

  const consoleCount = getActiveConsoleCount(tournament.config)
  const matchDurationMinutes = readMatchDurationMinutes(tournament.config)

  return (
    <ScoreEntryBoard
      matches={playable}
      consoleCount={consoleCount}
      matchDurationMinutes={matchDurationMinutes}
    />
  )
}

/**
 * Lit `config.match.duration_minutes` (Règle 11 — aucun défaut en dur).
 * Renvoie null si absent ou invalide.
 */
function readMatchDurationMinutes(config: Json): number | null {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return null
  }
  const match = (config as Record<string, Json | undefined>).match
  if (!match || typeof match !== 'object' || Array.isArray(match)) {
    return null
  }
  const raw = (match as Record<string, Json | undefined>).duration_minutes
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1) {
    return null
  }
  return raw
}