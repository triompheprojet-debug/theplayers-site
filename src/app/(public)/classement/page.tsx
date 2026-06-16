import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { getSeasonById } from '@/lib/seasons/get'
import {
  getActiveSeasonId,
  getSeasonLeaderboard,
} from '@/lib/standings/leaderboard'

import { LeaderboardTable } from './components/LeaderboardTable'
import { PodiumTop3 } from './components/PodiumTop3'

export const metadata = {
  title: 'Classement — THE PLAYERS',
}

export const dynamic = 'force-dynamic'

export default async function ClassementPage() {
  const seasonId = await getActiveSeasonId()

  if (!seasonId) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          icon={Trophy}
          title="Classement à venir"
          description="Le classement de saison sera publié ici dès qu'une saison sera en cours. Inscris-toi pour y figurer."
        />
      </div>
    )
  }

  const [season, entries] = await Promise.all([
    getSeasonById(seasonId),
    getSeasonLeaderboard(seasonId),
  ])

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          icon={Trophy}
          title="Classement à venir"
          description="Aucun résultat n'est encore figé pour cette saison. Reviens après les premiers tournois."
        />
      </div>
    )
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-text-primary">Classement</h1>
        <p className="text-sm text-text-secondary">
          {season?.name ?? 'Saison en cours'} · cumul des points
        </p>
      </header>

      <PodiumTop3 entries={top3} />

      {rest.length > 0 && <LeaderboardTable entries={rest} />}
    </div>
  )
}