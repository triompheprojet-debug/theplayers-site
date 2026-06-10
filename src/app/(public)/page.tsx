import { ArrowRight, Trophy } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { FCFA } from '@/components/shared/FCFA'
import { ROUTES } from '@/config/routes'
import { getAppConfig } from '@/lib/config/app-config'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

import { PartnersSection } from './components/PartnersSection'
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

  let hero

  // ─── Aucun tournoi actif : message configurable ─────────────────────
  if (!active) {
    const siteMessage = await getAppConfig('site_message')
    hero = (
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
  } else {
    const config = readPublicConfig(active)
    const firstPrize = config.prizes?.first_fcfa
    const gameName = config.game?.name

    // ─── Hero plein écran (maquette accueil) ──────────────────────────
    hero = (
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center md:px-6">
        {/* Fond : image + dégradé + motif points (pas du glassmorphism) */}
        <Image
          src="/images/accueil_background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-50"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Contenu */}
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-7">
          {active.is_registrations_open && (
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-1 px-4 py-2">
              <span className="relative flex size-2">
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full bg-success-neon opacity-75"
                  aria-hidden
                />
                <span className="relative inline-flex size-2 rounded-full bg-success-neon" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-success-neon">
                Inscriptions ouvertes
              </span>
            </span>
          )}

          <div className="flex flex-col items-center gap-3">
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              <span className="text-accent-violet">THE</span>{' '}
              <span className="text-text-primary">PLAYERS</span>
            </h1>
            <p className="text-xl font-bold text-text-secondary md:text-3xl">
              {active.name}
            </p>
          </div>

          {gameName && (
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-surface-1 px-6 py-4">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent-violet" />
              <p className="text-xs uppercase tracking-widest text-text-secondary">
                Jeu officiel
              </p>
              <p className="mt-1 text-xl font-bold text-accent-violet md:text-2xl">
                {gameName}
              </p>
            </div>
          )}

          <div className="flex w-full max-w-sm flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-widest text-text-secondary">
              Le début du tournoi dans
            </p>
            <CountdownTimer
              variant="boxes"
              targetDate={active.start_date}
              className="w-full"
            />
          </div>

          {firstPrize !== undefined && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs uppercase tracking-widest text-text-secondary">
                Cash prize · 1<sup>er</sup> prix
              </p>
              <FCFA amount={firstPrize} large neon />
            </div>
          )}

          <div className="mt-2 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {active.is_registrations_open && (
              <Link
                href={ROUTES.signUp}
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-md bg-gradient-to-br from-accent-violet to-accent-violet-dim px-8 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98] sm:w-auto"
              >
                {"S'inscrire en ligne"}
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            )}
            <Link
              href={ROUTES.tournament}
              className="inline-flex min-h-[56px] w-full items-center justify-center rounded-md bg-surface-2 px-8 font-semibold text-text-primary transition-colors hover:bg-surface-3 active:scale-[0.98] sm:w-auto"
            >
              {"Découvrir l'événement"}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {hero}
      <PartnersSection />
    </>
  )
}