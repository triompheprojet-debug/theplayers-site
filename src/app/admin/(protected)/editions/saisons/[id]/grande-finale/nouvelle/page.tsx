/**
 * Page de création de la Grande Finale d'une saison (M03.H).
 *
 * - Permission : SUPER_ADMIN.
 * - Vérifie que la saison existe (notFound sinon).
 * - Redirige vers le détail saison si une Grande Finale existe déjà
 *   (une seule GF par saison — contrainte DB + garde UX).
 * - Pré-charge tournament_defaults + event_location.
 */
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireSuperAdmin } from '@/lib/auth/permissions'
import { getAppConfig } from '@/lib/config/app-config'
import { getSeasonById } from '@/lib/seasons/get'
import {
  hasGrandFinal,
  listTournamentsBySeason,
} from '@/lib/tournaments/list-by-season'

import { GrandFinalForm } from '../../../../components/GrandFinalForm'

export const metadata = {
  title: 'Nouvelle Grande Finale — Administration',
  robots: { index: false, follow: false },
}

export default async function NewGrandFinalPage({
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

  // Une seule Grande Finale par saison — rediriger si déjà existante
  if (hasGrandFinal(tournaments)) {
    redirect(ROUTES.admin.editions.seasonDetail(season.id))
  }

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
            Grande Finale — Saison {season.season_number}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Tournoi de clôture de « {season.name} ». Réservé aux joueurs ayant
            atteint le seuil de qualification ({season.qualification_threshold}{' '}
            points).
          </p>
        </div>
      </header>

      {/* ─── Formulaire ─────────────────────────────────────────────── */}
      <GrandFinalForm
        seasonId={season.id}
        defaults={defaults ?? null}
        eventLocation={eventLocation ?? null}
      />
    </div>
  )
}