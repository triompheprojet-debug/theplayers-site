import { ArrowRight, Award, CalendarDays, Medal } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { DateBadge } from '@/components/shared/DateBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { FCFA } from '@/components/shared/FCFA'
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
    description: 'Format, règlement, programme et FAQ du tournoi en cours.',
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
  const firstPrize = config.prizes?.first_fcfa
  const secondPrize = config.prizes?.second_fcfa
  const canRegister = active.is_registrations_open

  return (
    <>
      {/* ─── Bannière (image + dégradé) ─────────────────────────────── */}
      <section className="relative flex min-h-64 flex-col justify-end overflow-hidden md:min-h-80">
        <Image
          src="/images/background-premiun.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-6 md:px-6">
          <div className="flex flex-col items-start gap-3">
            <TournamentTypeBadge type={active.tournament_type} />
            <h1 className="text-3xl font-black tracking-tight text-text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] md:text-5xl">
              {active.name}
            </h1>
            <span className="inline-flex items-center gap-2 text-text-secondary">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              <DateBadge from={active.start_date} to={active.end_date} />
            </span>
          </div>
        </div>
      </section>

      {/* ─── Contenu ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 pb-28 pt-8 md:px-6 md:pb-16">
        <TournamentTabs tournamentType={active.tournament_type} config={config} />

        {/* Cash Prize */}
        {(firstPrize !== undefined || secondPrize !== undefined) && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-accent-violet md:text-3xl">
              Cash Prize
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {firstPrize !== undefined && (
                <div className="rounded-xl bg-surface-1 p-6 shadow-glow-violet">
                  <div className="flex items-center gap-3">
                    <Award className="size-7 text-accent-violet" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
                      1ER prix
                    </span>
                  </div>
                  <p className="mt-3">
                    <FCFA amount={firstPrize} large />
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">Vainqueur</p>
                </div>
              )}
              {secondPrize !== undefined && (
                <div className="rounded-xl bg-surface-1 p-6">
                  <div className="flex items-center gap-3">
                    <Medal className="size-7 text-text-secondary" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                      2ÈME prix
                    </span>
                  </div>
                  <p className="mt-3">
                    <FCFA amount={secondPrize} large />
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">Finaliste</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Politique de paiement (Règle 9) */}
        <section className="relative mt-6 overflow-hidden rounded-2xl bg-surface-2 p-5">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-warning" />
          <h2 className="text-sm font-bold text-text-primary">
            Politique de paiement
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {"Le paiement constitue un engagement définitif. Une fois l'inscription validée et payée, "}
            <strong className="font-semibold text-warning">
              {"aucun remboursement n'est possible"}
            </strong>
            {", même en cas de désistement ou d'absence le jour du tournoi."}
          </p>
        </section>
      </div>

      {/* ─── Barre CTA fixe ─────────────────────────────────────────── */}
      {canRegister && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-surface-1">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                Inscription
              </span>
              {amount !== undefined ? (
                <span className="font-mono text-lg font-bold text-accent-violet">
                  {formatFCFA(amount)}
                </span>
              ) : (
                <span className="text-sm text-text-secondary">En ligne</span>
              )}
            </div>
            <Link
              href={ROUTES.signUp}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-accent-violet px-6 font-bold text-text-on-accent transition-transform active:scale-[0.98]"
            >
              {"S'inscrire"}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </>
  )
}