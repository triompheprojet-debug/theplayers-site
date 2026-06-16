import { Trophy } from 'lucide-react'
import { redirect } from 'next/navigation'

import { EmptyState } from '@/components/shared/EmptyState'
import { ROUTES } from '@/config/routes'
import { getSeasonById } from '@/lib/seasons/get'
import {
  getActiveSeasonId,
  getPlayerSeasonPosition,
} from '@/lib/standings/leaderboard'
import { createClient } from '@/lib/supabase/server'

import { MyPositionCard } from './components/MyPositionCard'

export const dynamic = 'force-dynamic'

export default async function PlayerRankingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const { data: profile } = await supabase
    .from('profiles')
    .select('pseudo')
    .eq('id', user.id)
    .maybeSingle()

  const seasonId = await getActiveSeasonId()

  if (!seasonId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <EmptyState
          icon={Trophy}
          title="Pas de saison en cours"
          description="Le classement de saison apparaîtra ici dès qu'une saison sera lancée."
        />
      </div>
    )
  }

  const [season, standing] = await Promise.all([
    getSeasonById(seasonId),
    getPlayerSeasonPosition(user.id, seasonId),
  ])

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-text-primary">Ma position</h1>
        <p className="text-sm text-text-secondary">
          {season?.name ?? 'Saison en cours'}
        </p>
      </header>

      {standing ? (
        <MyPositionCard pseudo={profile?.pseudo ?? 'Joueur'} standing={standing} />
      ) : (
        <EmptyState
          icon={Trophy}
          title="Pas encore classé"
          description="Participe à un tournoi de la saison pour apparaître au classement."
        />
      )}
    </div>
  )
}