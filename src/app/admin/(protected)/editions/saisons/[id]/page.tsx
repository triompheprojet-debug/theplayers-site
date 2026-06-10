/**
 * Détail d'une saison (M03.G) — refonte présentationnelle.
 * Infos saison + tournois enfants. CTA SUPER_ADMIN (ajout tournoi / Grande
 * Finale, masquée si déjà créée). notFound() si la saison n'existe pas.
 */
import { CalendarPlus, ChevronLeft, Crown } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DateBadge } from '@/components/shared/DateBadge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { getSeasonById } from '@/lib/seasons/get'
import {
  hasGrandFinal,
  listTournamentsBySeason,
} from '@/lib/tournaments/list-by-season'
import { cn } from '@/lib/utils'

import { SeasonTournamentsTable } from '../../components/SeasonTournamentsTable'

export const metadata = {
  title: 'Détail de la saison — Administration',
  robots: { index: false, follow: false },
}

const SEASON_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-accent-violet/15 text-accent-violet' },
  completed: { label: 'Terminée', className: 'bg-surface-2 text-text-muted' },
  archived: { label: 'Archivée', className: 'bg-surface-2 text-text-muted' },
}

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [session, season, tournaments] = await Promise.all([
    requireAdmin(),
    getSeasonById(id),
    listTournamentsBySeason(id),
  ])

  if (!season) {
    notFound()
  }

  const isSuperAdmin = session.role === 'super_admin'
  const grandFinalExists = hasGrandFinal(tournaments)
  const seasonTournamentCount = tournaments.filter(
    (t) => t.tournament_type === 'season',
  ).length
  const status = SEASON_STATUS[season.status] ?? {
    label: season.status,
    className: 'bg-surface-2 text-text-secondary',
  }

  return (
    <div className="max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={ROUTES.admin.editions.root}>
          <ChevronLeft aria-hidden />
          Retour aux éditions
        </Link>
      </Button>

      {/* ─── En-tête saison ──────────────────────────────────────────── */}
      <section className="rounded-2xl bg-surface-1 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Saison {season.season_number}
          </span>
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold text-text-primary">
          {season.name}
        </h1>
        {season.description && (
          <p className="mt-1 text-sm text-text-secondary">
            {season.description}
          </p>
        )}

        <div className="mt-5 grid gap-4 rounded-xl bg-surface-2/40 p-4 text-sm md:grid-cols-3">
          <InfoBlock label="Période">
            <DateBadge
              from={season.start_date}
              to={season.end_date}
              className="text-text-primary"
            />
          </InfoBlock>
          <InfoBlock label="Tournois prévus">
            <span className="font-mono tabular-nums text-text-primary">
              {seasonTournamentCount} / {season.expected_tournaments}
            </span>
          </InfoBlock>
          <InfoBlock label="Seuil de qualification">
            <span className="font-mono tabular-nums text-text-primary">
              {season.qualification_threshold} pts
            </span>
          </InfoBlock>
        </div>
      </section>

      {/* ─── Section tournois ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-text-primary">
            Tournois de la saison
          </h2>

          {isSuperAdmin && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button asChild variant="outline" size="sm" className="uppercase">
                <Link
                  href={ROUTES.admin.editions.newSeasonTournament(season.id)}
                >
                  <CalendarPlus aria-hidden />
                  Ajouter un tournoi
                </Link>
              </Button>
              {!grandFinalExists && (
                <Button asChild size="sm" className="uppercase">
                  <Link href={ROUTES.admin.editions.newGrandFinal(season.id)}>
                    <Crown aria-hidden />
                    Créer la Grande Finale
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <SeasonTournamentsTable tournaments={tournaments} />
      </section>
    </div>
  )
}

// ===========================================================================
// Bloc d'info (label + valeur)
// ===========================================================================
function InfoBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
        {label}
      </p>
      <div className="text-text-primary">{children}</div>
    </div>
  )
}