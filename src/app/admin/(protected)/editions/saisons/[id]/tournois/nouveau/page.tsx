/**
 * Page de création d'un tournoi DANS une saison (M03.G-2).
 *
 * - Permission : SUPER_ADMIN.
 * - Vérifie que la saison existe (notFound sinon).
 * - Pré-charge tournament_defaults + event_location + numéro suggéré.
 * - Formulaire = Client Component.
 */
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireSuperAdmin } from '@/lib/auth/permissions'
import { getAppConfig } from '@/lib/config/app-config'
import { getSeasonById } from '@/lib/seasons/get'
import {
  listTournamentsBySeason,
  nextTournamentNumber,
} from '@/lib/tournaments/list-by-season'

import { TournamentInSeasonForm } from '../../../../components/TournamentInSeasonForm'

export const metadata = {
  title: 'Nouveau tournoi de saison — Administration',
  robots: { index: false, follow: false },
}

export default async function NewSeasonTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await requireSuperAdmin()

  const [season, tournaments, defaults, eventLocation] = await Promise.all([
    getSeasonById(id),
    listTournamentsBySeason(id),
    getAppConfig('tournament_defaults'),
    getAppConfig('event_location'),
  ])

  if (!season) {
    notFound()
  }

  const suggestedNumber = nextTournamentNumber(tournaments)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ─── En-tête ─────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={ROUTES.admin.editions.seasonDetail(season.id)}>
            <ChevronLeft aria-hidden />
            Retour à la saison
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Nouveau tournoi — Saison {season.season_number}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Tournoi rattaché à « {season.name} ». Les points comptent pour le
            classement de la saison.
          </p>
        </div>
      </header>

      {/* ─── Formulaire ─────────────────────────────────────────────── */}
      <TournamentInSeasonForm
        seasonId={season.id}
        suggestedNumber={suggestedNumber}
        defaults={defaults ?? null}
        eventLocation={eventLocation ?? null}
      />
    </div>
  )
}