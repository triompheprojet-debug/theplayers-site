import {
  ArrowRight,
  Award,
  CalendarDays,
  ExternalLink,
  Gamepad2,
  Gauge,
  MapPin,
  Medal,
  Swords,
  Timer,
  Tv,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'

import { DateBadge } from '@/components/shared/DateBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { FCFA } from '@/components/shared/FCFA'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { ROUTES } from '@/config/routes'
import { formatFCFA } from '@/lib/format/fcfa'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

import {
  FaqSection,
  FormatSection,
  RulesSection,
  ScheduleSection,
} from './components/sections'
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
  const gameName = config.game?.name
  const platform = config.game?.platform
  const difficulty = config.game?.difficulty
  const matchDuration = config.match?.duration_minutes
  const location = config.location
  const canRegister = active.is_registrations_open
  const isGrandFinal = active.tournament_type === 'grand_final'

  // Bandeau de faits clés (aucune capacité / nombre de joueurs — confidentiel)
  const facts: Array<{ icon: LucideIcon; label: string; value: string }> = []
  if (gameName) facts.push({ icon: Gamepad2, label: 'Jeu', value: gameName })
  if (platform) facts.push({ icon: Tv, label: 'Plateforme', value: platform })
  facts.push({ icon: Swords, label: 'Format', value: 'Élimination directe' })
  if (matchDuration !== undefined)
    facts.push({ icon: Timer, label: 'Match', value: `${matchDuration} min` })
  if (difficulty) facts.push({ icon: Gauge, label: 'Niveau', value: difficulty })

  // Nav d'ancres
  const anchors = [
    { href: '#format', label: 'Format' },
    { href: '#programme', label: 'Programme' },
    { href: '#reglement', label: 'Règlement' },
    ...(location && (location.address || location.city)
      ? [{ href: '#lieu', label: 'Lieu' }]
      : []),
    { href: '#faq', label: 'FAQ' },
  ]

  return (
    <>
      {/* ═══════════════════════════ HERO ════════════════════════════ */}
      <section className="relative flex min-h-[78svh] flex-col justify-end overflow-hidden md:min-h-[70svh]">
        <Image
          src="/images/tournoi/Banniere_header_tournoi.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/20"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-10 md:px-6 md:pb-14">
          <div className="flex flex-col items-start gap-4">
            <TournamentTypeBadge type={active.tournament_type} />
            <h1 className="text-4xl font-black tracking-tight text-text-primary drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] md:text-6xl">
              {active.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-1/90 px-3 py-1.5 text-sm font-medium text-text-secondary">
                <CalendarDays className="size-4 shrink-0 text-accent-violet" aria-hidden />
                <DateBadge from={active.start_date} to={active.end_date} />
              </span>
              {gameName && (
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-1/90 px-3 py-1.5 text-sm font-semibold text-accent-violet">
                  <Gamepad2 className="size-4" aria-hidden />
                  {gameName}
                  {platform && (
                    <span className="text-text-secondary">· {platform}</span>
                  )}
                </span>
              )}
              {location?.city && (
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-1/90 px-3 py-1.5 text-sm font-medium text-text-secondary">
                  <MapPin className="size-4 shrink-0 text-accent-violet" aria-hidden />
                  {location.city}
                </span>
              )}
            </div>
            {canRegister && (
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={ROUTES.signUp}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-linear-to-br from-accent-violet to-accent-violet-dim px-8 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98]"
                >
                  {"S'inscrire en ligne"}
                  <ArrowRight className="size-5" aria-hidden />
                </Link>
                < a
                  href="#reglement"
                  className="inline-flex min-h-14 items-center justify-center rounded-md bg-surface-2/90 px-8 font-semibold text-text-primary transition-colors hover:bg-surface-3 active:scale-[0.98]"
                >
                  Voir le règlement
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FAITS CLÉS ══════════════════════════ */}
      {facts.length > 0 && (
        <div className="bg-surface-1">
          <div className="mx-auto flex max-w-4xl gap-3 overflow-x-auto px-4 py-4 md:grid md:grid-cols-5 md:overflow-visible md:px-6">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex min-w-32 shrink-0 flex-col items-center gap-1.5 rounded-xl bg-surface-2 px-4 py-3 text-center md:min-w-0"
              >
                <fact.icon className="size-5 text-accent-violet" aria-hidden />
                <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                  {fact.label}
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════ CONTENU ═══════════════════════════ */}
      <div className="mx-auto flex max-w-4xl flex-col gap-16 px-4 pb-28 pt-12 md:gap-20 md:px-6 md:pb-20">
        {/* Nav d'ancres */}
        <nav
          aria-label="Sections du tournoi"
          className="-mb-6 flex gap-2 overflow-x-auto"
        >
          {anchors.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="flex-none rounded-full bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary transition-colors hover:text-text-primary"
            >
              {a.label}
            </a>
          ))}
        </nav>

        {/* Cash Prize */}
        {(firstPrize !== undefined || secondPrize !== undefined) && (
          <section id="cash-prize" className="scroll-mt-24">
            <header className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
                Les récompenses
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-text-primary md:text-3xl">
                Cash prize
              </h2>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              {firstPrize !== undefined && (
                <div className="flex items-center gap-4 rounded-2xl bg-surface-1 p-6 shadow-glow-violet">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-success-neon/10 text-success-neon">
                    <Award className="size-6" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                      1<sup>er</sup> prix · Champion
                    </p>
                    <FCFA amount={firstPrize} large neon />
                  </div>
                </div>
              )}
              {secondPrize !== undefined && (
                <div className="flex items-center gap-4 rounded-2xl bg-surface-1 p-6">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet">
                    <Medal className="size-6" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                      2<sup>e</sup> prix · Finaliste
                    </p>
                    <FCFA
                      amount={secondPrize}
                      className="text-2xl font-bold text-text-primary md:text-3xl"
                    />
                  </div>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-text-secondary">
              {isGrandFinal
                ? "Les gains de la Grande Finale sont remis lors de la cérémonie de clôture."
                : "Les gains sont versés en espèces lors de la cérémonie de remise des prix, le dimanche soir."}
            </p>
          </section>
        )}

        <FormatSection
          tournamentType={active.tournament_type}
          game={config.game}
          match={config.match}
        />

        <ScheduleSection schedule={config.schedule} />

        <RulesSection rules={config.rules} />

        {/* Le lieu */}
        {location && (location.address || location.city) && (
          <section id="lieu" className="scroll-mt-24">
            <header className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
                Sur place
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-text-primary md:text-3xl">
                Le lieu
              </h2>
            </header>
            <div className="grid overflow-hidden rounded-2xl bg-surface-1 md:grid-cols-2">
              <div className="relative aspect-video md:aspect-auto md:min-h-56">
                <Image
                  src="/images/tournoi/lieu.webp"
                  alt=""
                  fill
                  sizes="(min-width: 768px) 28rem, 100vw"
                  className="object-cover object-center"
                />
                <div
                  className="absolute inset-0 bg-linear-to-t from-surface-1/60 to-transparent md:bg-linear-to-r"
                  aria-hidden
                />
              </div>
              <div className="flex flex-col gap-4 p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent-violet/10 text-accent-violet">
                  <MapPin className="size-6" aria-hidden />
                </span>
                <div>
                  {location.address && (
                    <p className="font-semibold text-text-primary">
                      {location.address}
                    </p>
                  )}
                  {(location.city || location.country) && (
                    <p className="mt-1 text-sm text-text-secondary">
                      {[location.city, location.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
                {location.maps_url && (
                  <a
                    href={location.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex min-h-12 w-fit items-center gap-2 rounded-md bg-surface-2 px-5 font-semibold text-text-primary transition-colors hover:bg-surface-3 active:scale-[0.98]"
                  >
                    Voir sur la carte
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        <FaqSection
          tournamentType={active.tournament_type}
          registration={config.registration}
        />

        {/* Politique de paiement (Règle 9) */}
        <section className="relative overflow-hidden rounded-2xl bg-surface-2 p-5">
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

        {/* Appel final */}
        {canRegister && (
          <section className="overflow-hidden rounded-2xl bg-linear-to-br from-accent-violet/15 to-surface-1 p-8 text-center md:p-12">
            <h2 className="text-2xl font-black text-text-primary md:text-4xl">
              {"Prêt à entrer dans l'arène ?"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary md:text-base">
              {
                "Choisis ton pseudo, réserve ta place et reçois ton badge officiel. La compétition t'attend."
              }
            </p>
            <Link
              href={ROUTES.signUp}
              className="mt-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-linear-to-br from-accent-violet to-accent-violet-dim px-8 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98]"
            >
              {"S'inscrire en ligne"}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </section>
        )}
      </div>

      {/* ═══════════════════════ BARRE CTA FIXE ══════════════════════ */}
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