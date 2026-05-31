/**
 * Page détail d'une saison (M03.G).
 *
 * - Affiche les infos de la saison + ses tournois enfants.
 * - CTA SUPER_ADMIN : "Ajouter un tournoi" et "Créer la Grande Finale"
 *   (cette dernière masquée si une GF existe déjà).
 * - notFound() si la saison n'existe pas.
 */
import { CalendarPlus, ChevronLeft, Crown } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DateBadge } from '@/components/shared/DateBadge'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { getSeasonById } from '@/lib/seasons/get'
import {
  hasGrandFinal,
  listTournamentsBySeason,
} from '@/lib/tournaments/list-by-season'

import { SeasonTournamentsTable } from '../../components/SeasonTournamentsTable'

export const metadata = {
  title: 'Détail de la saison — Administration',
  robots: { index: false, follow: false },
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
  const seasonStatusLabel: Record<string, string> = {
    active: 'Active',
    completed: 'Terminée',
    archived: 'Archivée',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ─── Fil d'Ariane ────────────────────────────────────────────── */}
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={ROUTES.admin.editions.root}>
          <ChevronLeft aria-hidden />
          Retour aux éditions
        </Link>
      </Button>

      {/* ─── En-tête saison ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
                  Saison {season.season_number}
                </Badge>
                <Badge variant="outline">
                  {seasonStatusLabel[season.status] ?? season.status}
                </Badge>
              </div>
              <CardTitle className="text-xl">{season.name}</CardTitle>
              {season.description && (
                <CardDescription>{season.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
          <InfoBlock label="Période">
            <DateBadge from={season.start_date} to={season.end_date} />
          </InfoBlock>
          <InfoBlock label="Tournois prévus">
            <span className="tabular-nums">
              {tournaments.filter((t) => t.tournament_type === 'season').length}{' '}
              / {season.expected_tournaments}
            </span>
          </InfoBlock>
          <InfoBlock label="Seuil de qualification">
            <span className="tabular-nums">
              {season.qualification_threshold} pts
            </span>
          </InfoBlock>
        </CardContent>
      </Card>

      {/* ─── Section tournois ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Tournois de la saison
          </h2>

          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.admin.editions.newSeasonTournament(season.id)}>
                  <CalendarPlus aria-hidden />
                  Ajouter un tournoi
                </Link>
              </Button>
              {!grandFinalExists && (
                <Button asChild size="sm">
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