import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { getConfirmedRevenue } from '@/lib/payments/revenue'
import {
  getPendingPaymentsCount,
  listPendingPayments,
} from '@/lib/payments/verify'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'
import { listSelectableTournaments } from '@/lib/tournaments/list-selectable'

import { ActivityFeed, type ActivityEntry } from './components/ActivityFeed'
import { CapacityCard } from './components/CapacityCard'
import { PendingPaymentsSection } from './components/PendingPaymentsSection'
import { RegistrationsToggle } from './components/RegistrationsToggle'
import { RevenuesCard } from './components/RevenuesCard'
import { StatsGrid, type RegistrationStats } from './components/StatsGrid'

export const metadata = {
  title: 'Tableau de bord — Admin',
  robots: { index: false, follow: false },
}

const ACTIVE_STATUSES = ['reserved', 'awaiting_verification', 'confirmed']

/**
 * Dashboard admin enrichi — refonte présentationnelle.
 * Shell (ligne rouge + sidebar + topbar) depuis (protected)/layout.tsx.
 * Lectures en service_role. Capacité interne (Règle 1). Cas vides conservés.
 */
export default async function AdminDashboardPage() {
  const session = await requireAdmin()

  const [active, tournaments] = await Promise.all([
    getActiveTournamentForAdmin(),
    listSelectableTournaments(),
  ])

  const hasEditions = tournaments.length > 0
  const data = active ? await loadActiveDashboardData(active.id) : null

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
          Tableau de bord
        </p>
        {active ? (
          <>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary md:text-3xl">
              {active.name}
            </h1>
            <p className="text-sm text-text-secondary">
              {"Vue d'ensemble et gestion des inscriptions en temps réel."}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
              Bonjour, {session.username}
            </h1>
            <p className="text-sm text-text-secondary">
              Rôle : {session.role.replace('_', ' ')}
            </p>
          </>
        )}
      </header>

      {!hasEditions ? (
        <section className="rounded-2xl bg-surface-1 p-8 text-center">
          <h2 className="text-lg font-semibold text-text-primary">
            Aucune édition pour le moment
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Créez votre première édition pour pouvoir la définir comme tournoi
            actif et gérer les inscriptions.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href={ROUTES.admin.editions.newOffSeason}>
                <PlusCircle className="size-4" aria-hidden />
                <span className="ml-2">Créer votre première édition</span>
              </Link>
            </Button>
          </div>
        </section>
      ) : active && data ? (
        <>
          <RegistrationsToggle
            tournamentId={active.id}
            initialIsOpen={active.is_registrations_open}
          />

          <StatsGrid stats={data.stats} />

          <CapacityCard capacity={active.capacity} occupied={data.occupied} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenuesCard revenue={data.revenue} />
            <PendingPaymentsSection
              count={data.pendingCount}
              preview={data.pendingPreview}
            />
          </div>

          <ActivityFeed entries={data.activity} />
        </>
      ) : (
        <section className="rounded-2xl bg-surface-1 p-6">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
            Tournoi actif
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Sélectionnez un tournoi actif (bouton « Changer » en haut) pour
            afficher les statistiques, la capacité, les revenus et les paiements
            à traiter.
          </p>
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chargement des données du tournoi actif (service_role)
// ---------------------------------------------------------------------------
interface ActiveDashboardData {
  stats: RegistrationStats
  occupied: number
  revenue: Awaited<ReturnType<typeof getConfirmedRevenue>>
  pendingCount: number
  pendingPreview: Awaited<ReturnType<typeof listPendingPayments>>
  activity: ActivityEntry[]
}

async function loadActiveDashboardData(
  tournamentId: string,
): Promise<ActiveDashboardData> {
  const supabase = createServiceRoleClient()

  const [statusRows, revenue, pendingCount, pending, activityRows] =
    await Promise.all([
      supabase
        .from('registrations')
        .select('status')
        .eq('tournament_id', tournamentId),
      getConfirmedRevenue(tournamentId),
      getPendingPaymentsCount(tournamentId),
      listPendingPayments(tournamentId),
      supabase
        .from('activity_log')
        .select('id, action_type, description, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

  const rows = statusRows.data ?? []
  const stats: RegistrationStats = {
    total: rows.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
    reserved: rows.filter((r) => r.status === 'reserved').length,
    awaitingVerification: rows.filter(
      (r) => r.status === 'awaiting_verification',
    ).length,
    confirmed: rows.filter((r) => r.status === 'confirmed').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }

  const activity: ActivityEntry[] = (activityRows.data ?? []).map((a) => ({
    id: a.id,
    actionType: a.action_type,
    description: a.description,
    createdAt: a.created_at,
  }))

  return {
    stats,
    occupied: stats.total,
    revenue,
    pendingCount,
    pendingPreview: pending.slice(0, 4),
    activity,
  }
}