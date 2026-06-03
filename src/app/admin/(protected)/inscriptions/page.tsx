import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { RegistrationFilters } from './components/RegistrationFilters'
import {
  RegistrationsTable,
  type RegistrationListRow,
} from './components/RegistrationsTable'

import type { Database } from '@/types/database.types'

type RegistrationStatus = Database['public']['Enums']['registration_status']

export const metadata = {
  title: 'Inscriptions — Admin',
  robots: { index: false, follow: false },
}

const VALID_STATUSES: RegistrationStatus[] = [
  'reserved',
  'awaiting_verification',
  'confirmed',
  'rejected',
  'cancelled',
]

/**
 * Liste des inscriptions du tournoi actif (M10).
 * Server Component : lecture service_role + jointure profil. Filtre statut en
 * base, filtre pseudo côté serveur (jeu de données admin restreint).
 */
export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  await requireAdmin()

  const tournament = await getActiveTournamentForAdmin()
  const params = await searchParams

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader />
        <EmptyState
          title="Aucun tournoi actif"
          description="Sélectionnez un tournoi actif pour voir ses inscriptions."
        />
      </div>
    )
  }

  const rows = await loadRegistrations(tournament.id, params)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader />
      <RegistrationFilters />
      <RegistrationsTable rows={rows} />
    </div>
  )
}

function PageHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Gestion
        </p>
        <h1 className="text-2xl font-bold text-text-primary">Inscriptions</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Inscriptions du tournoi actif. Inscrivez un joueur sur place si
          nécessaire.
        </p>
      </div>
      <Button asChild>
        <Link href={ROUTES.admin.registrations.manual}>
          <PlusCircle className="size-4" aria-hidden />
          Inscription manuelle
        </Link>
      </Button>
    </header>
  )
}

async function loadRegistrations(
  tournamentId: string,
  params: { status?: string; q?: string },
): Promise<RegistrationListRow[]> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('registrations')
    .select(
      `id, status, badge_number, registered_via, created_at,
       profiles!registrations_player_id_fkey ( pseudo, phone )`,
    )
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false })

  const status = params.status
  if (status && VALID_STATUSES.includes(status as RegistrationStatus)) {
    query = query.eq('status', status as RegistrationStatus)
  }

  const { data, error } = await query
  if (error) {
    console.error('[loadRegistrations]', error.message)
    return []
  }

  const term = params.q?.trim().toLowerCase()

  return (data ?? [])
    .map((r) => {
      const profile = r.profiles as unknown as {
        pseudo: string
        phone: string
      } | null
      return {
        id: r.id,
        pseudo: profile?.pseudo ?? '—',
        phone: profile?.phone ?? '',
        status: r.status,
        badgeNumber: r.badge_number,
        registeredVia: r.registered_via,
        createdAt: r.created_at,
      }
    })
    .filter((row) =>
      term ? row.pseudo.toLowerCase().includes(term) : true,
    )
}