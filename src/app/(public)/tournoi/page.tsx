import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { DateBadge } from '@/components/shared/DateBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { ROUTES } from '@/config/routes'
import { formatFCFA } from '@/lib/format/fcfa'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

import { TournamentTabs } from './components/TournamentTabs'
import { readPublicConfig } from './components/config'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const active = await getActiveTournamentPublic()
  return {
    title: active ? `${active.name} — Tournoi` : 'Tournoi — THE PLAYERS',
    description:
      'Format, règlement, programme et FAQ du tournoi en cours.',
  }
}

export default async function TournamentPage() {
  const active = await getActiveTournamentPublic()

  if (!active) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="Aucun tournoi en cours"
          description="Aucun tournoi n'est actuellement programmé. Revenez bientôt."
        />
      </section>
    )
  }

  const config = readPublicConfig(active)
  const amount = config.registration?.amount_fcfa
  const canRegister = active.is_registrations_open

  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pb-28 pt-10 md:px-6 md:pb-16">
        {/* Bannière */}
        <header className="flex flex-col gap-3">
          <TournamentTypeBadge
            type={active.tournament_type}
            className="self-start"
          />
          <h1 className="text-2xl font-bold text-text-primary md:text-4xl">
            {active.name}
          </h1>
          <DateBadge from={active.start_date} to={active.end_date} />
        </header>

        {/* Onglets */}
        <div className="mt-8">
          <TournamentTabs
            tournamentType={active.tournament_type}
            config={config}
          />
        </div>
      </section>

      {/* Barre CTA fixe en bas (mobile-first, single-thumb) */}
      {canRegister && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-surface-1/95 backdrop-blur-md">
          <div className="mx-auto max-w-4xl px-4 py-3 md:px-6">
            <Link
              href={ROUTES.signUp}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-md bg-accent-violet px-6 font-bold text-text-on-accent active:scale-[0.98]"
            >
              S&apos;inscrire
              {amount !== undefined && (
                <span className="font-mono">— {formatFCFA(amount)}</span>
              )}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </>
  )
}