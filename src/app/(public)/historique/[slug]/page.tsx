import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EmptyState } from '@/components/shared/EmptyState'
import { ROUTES } from '@/config/routes'
import { getTournamentStandings, resolveHistorySlug } from '@/lib/historique/get'
import { getSeasonLeaderboard } from '@/lib/standings/leaderboard'

import { LeaderboardTable } from '../../classement/components/LeaderboardTable'
import { PodiumTop3 } from '../../classement/components/PodiumTop3'
import { TournamentResults } from '../components/TournamentResults'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const resolved = await resolveHistorySlug(slug)
  return {
    title: resolved ? `${resolved.name} — Historique` : 'Historique',
  }
}

export default async function HistoryDetailPage({ params }: PageProps) {
  const { slug } = await params
  const resolved = await resolveHistorySlug(slug)
  if (!resolved) notFound()

  const seasonEntries =
    resolved.kind === 'season'
      ? await getSeasonLeaderboard(resolved.seasonId)
      : []
  const tournamentRows =
    resolved.kind === 'off_season'
      ? await getTournamentStandings(resolved.tournamentId)
      : []

  const subtitle =
    resolved.kind === 'season'
      ? `Classement final · ${resolved.isCurrent ? 'en cours' : 'archivée'}`
      : `Hors-saison · ${resolved.isCurrent ? 'en cours' : 'terminé'}`

  const isEmpty =
    resolved.kind === 'season'
      ? seasonEntries.length === 0
      : tournamentRows.length === 0

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link
        href={ROUTES.history}
        className="mb-2 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Historique
      </Link>

      <header className="mb-5">
        <h1 className="text-xl font-bold text-text-primary">{resolved.name}</h1>
        <p className="text-sm text-text-secondary">{subtitle}</p>
      </header>

      {isEmpty ? (
        <div className="py-10">
          <EmptyState
            icon={Trophy}
            title="Classement à venir"
            description="Aucun résultat n'a encore été figé pour cette édition."
          />
        </div>
      ) : resolved.kind === 'season' ? (
        <>
          <PodiumTop3 entries={seasonEntries.slice(0, 3)} />
          {seasonEntries.length > 3 && (
            <LeaderboardTable entries={seasonEntries.slice(3)} />
          )}
        </>
      ) : (
        <TournamentResults rows={tournamentRows} />
      )}
    </div>
  )
}