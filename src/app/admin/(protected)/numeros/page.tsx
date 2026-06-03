import { EmptyState } from '@/components/shared/EmptyState'
import { requireAdmin } from '@/lib/auth/permissions'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import {
  BadgeNumberGrid,
  type BadgeAssignment,
} from './components/BadgeNumberGrid'
import {
  ReservationPanel,
  type PendingReservation,
} from './components/ReservationPanel'

export const metadata = {
  title: 'Numéros de badge — Admin',
  robots: { index: false, follow: false },
}

/**
 * Numéros de badge du tournoi actif (M10).
 *
 * Grille des numéros attribués (joueurs confirmés) + panneau des réservations
 * encore sans badge. Lecture service_role. Page admin — la capacité y est
 * visible (Règle 1 : jamais côté public).
 */
export default async function AdminBadgeNumbersPage() {
  await requireAdmin()

  const tournament = await getActiveTournamentForAdmin()

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader />
        <EmptyState
          title="Aucun tournoi actif"
          description="Sélectionnez un tournoi actif pour voir ses numéros de badge."
        />
      </div>
    )
  }

  const { assignments, reservations } = await loadBadgeData(tournament.id)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <BadgeNumberGrid
          assignments={assignments}
          capacity={tournament.capacity}
        />
        <ReservationPanel reservations={reservations} />
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <header>
      <p className="text-xs uppercase tracking-wider text-text-secondary">
        Tournoi actif
      </p>
      <h1 className="text-2xl font-bold text-text-primary">Numéros de badge</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Attribution automatique à la confirmation du paiement. Non modifiable
        manuellement.
      </p>
    </header>
  )
}

async function loadBadgeData(tournamentId: string): Promise<{
  assignments: BadgeAssignment[]
  reservations: PendingReservation[]
}> {
  const supabase = createServiceRoleClient()

  const [confirmedResult, pendingResult] = await Promise.all([
    supabase
      .from('registrations')
      .select(
        'badge_number, profiles!registrations_player_id_fkey ( pseudo )',
      )
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed')
      .not('badge_number', 'is', null)
      .order('badge_number', { ascending: true }),
    supabase
      .from('registrations')
      .select(
        'id, status, profiles!registrations_player_id_fkey ( pseudo )',
      )
      .eq('tournament_id', tournamentId)
      .in('status', ['reserved', 'awaiting_verification'])
      .order('created_at', { ascending: true }),
  ])

  const assignments: BadgeAssignment[] = (confirmedResult.data ?? [])
    .map((row) => {
      const profile = row.profiles as unknown as { pseudo: string } | null
      return {
        badgeNumber: row.badge_number as number,
        pseudo: profile?.pseudo ?? '—',
      }
    })
    .filter((a) => a.badgeNumber != null)

  const reservations: PendingReservation[] = (pendingResult.data ?? []).map(
    (row) => {
      const profile = row.profiles as unknown as { pseudo: string } | null
      return {
        id: row.id,
        pseudo: profile?.pseudo ?? '—',
        status: row.status as PendingReservation['status'],
      }
    },
  )

  return { assignments, reservations }
}