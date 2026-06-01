import { ArrowRight, CalendarDays, MapPin, Trophy } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { DateBadge } from '@/components/shared/DateBadge'
import { FCFA } from '@/components/shared/FCFA'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { ROUTES } from '@/config/routes'
import { getAppConfig } from '@/lib/config/app-config'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

import { readPublicConfig } from './tournoi/components/config'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const active = await getActiveTournamentPublic()
  return {
    title: active
      ? `${active.name} — THE PLAYERS`
      : 'THE PLAYERS — Liga Esport FC',
    description:
      'Tournois esport EA Sports FC à Pointe-Noire. Inscriptions, classement et brackets en ligne.',
  }
}

export default async function HomePage() {
  const active = await getActiveTournamentPublic()

  // ─── Aucun tournoi actif : message configurable ─────────────────────
  if (!active) {
    const siteMessage = await getAppConfig('site_message')
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center md:px-6">
        <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-surface-1 text-text-secondary">
          <Trophy className="size-8" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold text-text-primary md:text-4xl">
          Aucun tournoi en cours
        </h1>
        <p className="max-w-md text-base text-text-secondary">
          {siteMessage ??
            'Le prochain tournoi sera annoncé prochainement. Revenez bientôt.'}
        </p>
        <Link
          href={ROUTES.eventTypes}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-surface-2 px-6 font-semibold text-text-primary active:scale-[0.98]"
        >
          Découvrir nos événements
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    )
  }

  const config = readPublicConfig(active)
  const firstPrize = config.prizes?.first_fcfa
  const secondPrize = config.prizes?.second_fcfa
  const location = config.location

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-col gap-5">
          <TournamentTypeBadge
            type={active.tournament_type}
            className="self-start"
          />
          <h1 className="text-3xl font-black leading-tight tracking-tight text-text-primary md:text-5xl">
            {active.name}
          </h1>

          <div className="flex flex-col gap-2 text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              <DateBadge from={active.start_date} to={active.end_date} />
            </span>
            {location?.city && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden />
                <span>
                  {location.city}
                  {location.country ? `, ${location.country}` : ''}
                </span>
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            {active.is_registrations_open && (
              <Link
                href={ROUTES.signUp}
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-md bg-gradient-to-br from-accent-violet to-accent-violet-dim px-8 font-bold text-text-on-accent shadow-[var(--shadow-glow-violet)] transition-transform active:scale-[0.98]"
              >
                S&apos;inscrire en ligne
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            )}
            <Link
              href={ROUTES.tournament}
              className="inline-flex min-h-[56px] items-center justify-center rounded-md bg-surface-2 px-8 font-semibold text-text-primary active:scale-[0.98]"
            >
              Détails du tournoi
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Cash prizes ───────────────────────────────────────────── */}
      {(firstPrize || secondPrize) && (
        <section className="mx-auto max-w-5xl px-4 pb-12 md:px-6 md:pb-16">
          <h2 className="text-xs uppercase tracking-wider text-text-secondary">
            Dotations
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {firstPrize !== undefined && (
              <div className="rounded-2xl bg-surface-1 p-6">
                <p className="text-xs uppercase tracking-wider text-text-secondary">
                  1<sup>re</sup> place
                </p>
                <p className="mt-3">
                  <FCFA amount={firstPrize} large neon />
                </p>
              </div>
            )}
            {secondPrize !== undefined && (
              <div className="rounded-2xl bg-surface-1 p-6">
                <p className="text-xs uppercase tracking-wider text-text-secondary">
                  2<sup>e</sup> place
                </p>
                <p className="mt-3">
                  <FCFA amount={secondPrize} large />
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}