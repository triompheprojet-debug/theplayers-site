import {
  ArrowRight,
  Check,
  Compass,
  Crown,
  Info,
  Radio,
  Sparkles,
  Swords,
  Ticket,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Types d\u2019\u00e9v\u00e9nements — THE PLAYERS',
  description:
    'Hors Saison, Saison et Grande Finale : comprendre les trois formats de Liga Esport FC.',
}

type Tt = 'off_season' | 'season' | 'grand_final'

const ACCENT: Record<Tt, { text: string; chip: string; dot: string }> = {
  off_season: {
    text: 'text-success-neon',
    chip: 'bg-success-neon/10',
    dot: 'bg-success-neon',
  },
  season: {
    text: 'text-accent-violet',
    chip: 'bg-accent-violet/10',
    dot: 'bg-accent-violet',
  },
  grand_final: {
    text: 'text-warning',
    chip: 'bg-warning/10',
    dot: 'bg-warning',
  },
}

interface EventType {
  type: Tt
  icon: LucideIcon
  step: string
  label: string
  title: string
  image: string
  tagline: string
  bullets: Array<{ text: string; warn?: boolean }>
  features?: Array<{ icon: LucideIcon; text: string }>
}

const EVENTS: EventType[] = [
  {
    type: 'off_season',
    icon: Compass,
    step: '01',
    label: 'Ouvert à tous · Indépendant',
    title: 'Hors Saison',
    image: '/images/types-evenements/hors-saison.webp',
    tagline:
      "La porte d'entrée du circuit. Viens tester ton niveau, t'amuser et repartir avec le cash prize.",
    bullets: [
      { text: 'Tournoi découverte ouvert à tous les niveaux.' },
      { text: 'Cash prize direct pour les vainqueurs.' },
      { text: 'Chaque édition est un week-end autonome et indépendant.' },
      { text: "N'attribue aucun point de ligue.", warn: true },
      { text: "Sans impact sur le classement de Saison.", warn: true },
    ],
  },
  {
    type: 'season',
    icon: Swords,
    step: '02',
    label: 'Officiel · Compétitif',
    title: 'Saison régulière',
    image: '/images/types-evenements/saison.webp',
    tagline:
      'Le cœur de la compétition. Chaque tournoi te rapporte des points et fait grimper ton rang.',
    bullets: [
      { text: 'Tournois officiels du circuit Liga Esport FC.' },
      { text: 'Chaque parcours rapporte des points de ligue.' },
      {
        text: 'Les points s\u2019accumulent dans le classement de la saison.',
      },
      {
        text: 'Monte les rangs, de Bronze à Légende, au fil des tournois.',
      },
      {
        text: 'Voie principale de qualification pour la Grande Finale.',
      },
      {
        text: "L'inscription se fait tournoi par tournoi.",
      },
    ],
  },
  {
    type: 'grand_final',
    icon: Crown,
    step: '03',
    label: 'Premium · Sur invitation',
    title: 'Grande Finale',
    image: '/images/types-evenements/Grande-finale.webp',
    tagline:
      "La consécration. Les meilleurs joueurs de la saison s'affrontent pour le titre, sous les projecteurs.",
    bullets: [
      { text: 'Événement premium qui clôture chaque saison.' },
      {
        text: 'Réservé aux joueurs qualifiés en tête du classement.',
      },
      { text: "Le plus gros cash prize de l'année." },
      {
        text: 'Événement distinct, non comptabilisé dans les tournois de saison.',
      },
    ],
    features: [
      { icon: Radio, text: 'Diffusion en live' },
      { icon: Ticket, text: 'Ouvert aux spectateurs' },
      { icon: Sparkles, text: 'Salle premium' },
    ],
  },
]

export default async function EventTypesPage() {
  const active = await getActiveTournamentPublic()

  return (
    <>
      {/* ═══════════════════════════ HERO ════════════════════════════ */}
      <section className="relative flex min-h-[58svh] flex-col justify-end overflow-hidden">
        <Image
          src="/images/types-evenements/header-bandeau.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-10 md:px-6 md:pb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-violet">
            Le circuit compétitif
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-black uppercase tracking-tight text-text-primary drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] md:text-6xl">
            De la découverte à la consécration
          </h1>
          <p className="mt-4 max-w-xl text-sm text-text-secondary md:text-base">
            {
              "Trois formats d'événements, une seule ambition : faire grandir l'esport à Pointe-Noire. Voici comment ils s'articulent."
            }
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20">
        {/* Progression */}
        <ol className="flex items-center justify-center gap-2 md:gap-4">
          {EVENTS.map((event, index) => (
            <li key={event.type} className="flex items-center gap-2 md:gap-4">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide md:text-sm',
                  ACCENT[event.type].chip,
                  ACCENT[event.type].text,
                )}
              >
                <span className={cn('size-2 rounded-full', ACCENT[event.type].dot)} aria-hidden />
                {event.title}
              </span>
              {index < EVENTS.length - 1 && (
                <ArrowRight className="size-4 shrink-0 text-text-muted" aria-hidden />
              )}
            </li>
          ))}
        </ol>

        {/* Sections par type */}
        <div className="mt-16 flex flex-col gap-16 md:gap-24">
          {EVENTS.map((event, index) => {
            const accent = ACCENT[event.type]
            const isActive = active?.tournament_type === event.type
            const reverse = index % 2 === 1

            return (
              <section
                key={event.type}
                className="grid items-center gap-8 md:grid-cols-2"
              >
                <div
                  className={cn(
                    'relative aspect-[4/3] overflow-hidden rounded-2xl',
                    reverse ? 'md:order-2' : 'md:order-1',
                  )}
                >
                  <Image
                    src={event.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 32rem, 100vw"
                    className="object-cover object-center"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-background/55 to-transparent"
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'absolute left-4 top-4 font-mono text-5xl font-black opacity-80',
                      accent.text,
                    )}
                    aria-hidden
                  >
                    {event.step}
                  </span>
                </div>

                <div
                  className={cn(
                    'flex flex-col gap-5',
                    reverse ? 'md:order-1' : 'md:order-2',
                  )}
                >
                  <header className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex size-11 shrink-0 items-center justify-center rounded-full',
                          accent.chip,
                          accent.text,
                        )}
                      >
                        <event.icon className="size-6" aria-hidden />
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-surface-1 px-3 py-1">
                          <span className="relative flex size-2">
                            <span
                              className={cn(
                                'absolute inline-flex size-full animate-ping rounded-full opacity-75',
                                accent.dot,
                              )}
                              aria-hidden
                            />
                            <span className={cn('relative inline-flex size-2 rounded-full', accent.dot)} />
                          </span>
                          <span className={cn('text-xs font-semibold uppercase tracking-widest', accent.text)}>
                            En cours
                          </span>
                        </span>
                      )}
                    </div>
                    <p className={cn('text-xs font-semibold uppercase tracking-widest', accent.text)}>
                      {event.label}
                    </p>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-text-primary md:text-4xl">
                      {event.title}
                    </h2>
                  </header>

                  <p className="text-sm leading-relaxed text-text-secondary md:text-base">
                    {event.tagline}
                  </p>

                  <ul className="flex flex-col gap-2.5">
                    {event.bullets.map((bullet) => (
                      <li
                        key={bullet.text}
                        className={cn(
                          'flex items-start gap-2.5 text-sm',
                          bullet.warn
                            ? 'font-medium text-danger'
                            : 'text-text-secondary',
                        )}
                      >
                        {bullet.warn ? (
                          <X className="mt-0.5 size-4 shrink-0" aria-hidden />
                        ) : (
                          <Check className={cn('mt-0.5 size-4 shrink-0', accent.text)} aria-hidden />
                        )}
                        {bullet.text}
                      </li>
                    ))}
                  </ul>

                  {event.features && (
                    <ul className="flex flex-wrap gap-2">
                      {event.features.map((feature) => (
                        <li
                          key={feature.text}
                          className="inline-flex items-center gap-2 rounded-full bg-surface-1 px-3 py-1.5 text-xs font-semibold text-text-primary"
                        >
                          <feature.icon className={cn('size-3.5', accent.text)} aria-hidden />
                          {feature.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        {/* Comparatif Hors Saison vs Saison */}
        <section className="mt-20">
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
              Bien comprendre
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-text-primary md:text-3xl">
              Hors Saison ou Saison ?
            </h2>
          </header>

          <div className="mt-6 overflow-hidden rounded-2xl bg-surface-1">
            {[
              { label: 'Points de ligue', off: 'Aucun', on: 'Oui, à chaque tournoi' },
              { label: 'Impact sur le classement', off: 'Aucun', on: 'Compte pour la saison' },
              { label: 'Qualification Grande Finale', off: 'Non concerné', on: 'Voie principale' },
              { label: 'Cash prize', off: 'Direct', on: 'Direct + points' },
              { label: 'Inscription', off: 'Au tournoi', on: 'Au tournoi' },
            ].map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  'grid grid-cols-3 gap-3 px-4 py-3 md:px-6',
                  i % 2 === 1 && 'bg-surface-2/40',
                )}
              >
                <span className="text-xs font-semibold text-text-primary md:text-sm">
                  {row.label}
                </span>
                <span className="flex items-center gap-2 text-xs text-text-secondary md:text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-success-neon" aria-hidden />
                  {row.off}
                </span>
                <span className="flex items-center gap-2 text-xs text-text-secondary md:text-sm">
                  <span className="size-2 shrink-0 rounded-full bg-accent-violet" aria-hidden />
                  {row.on}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3 bg-surface-2 px-4 py-2 md:px-6">
              <span aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-widest text-success-neon">
                Hors Saison
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-violet">
                Saison
              </span>
            </div>
          </div>
        </section>

        {/* Note */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-surface-1 p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden />
          <p className="text-sm leading-relaxed text-text-secondary">
            {"Les tournois Hors Saison sont totalement indépendants du classement de la Saison régulière et n'impactent pas l'éligibilité à la Grande Finale."}
          </p>
        </div>

        {/* CTA */}
        <section className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-accent-violet/15 to-surface-1 p-8 text-center md:p-12">
          <Trophy className="mx-auto size-10 text-accent-violet" aria-hidden />
          <h2 className="mt-4 text-2xl font-black text-text-primary md:text-4xl">
            Ta route commence ici
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary md:text-base">
            {
              "Découvre le tournoi en cours et inscris-toi pour entrer dans la compétition."
            }
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ROUTES.tournament}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-br from-accent-violet to-accent-violet-dim px-8 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98] sm:w-auto"
            >
              Voir le tournoi en cours
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link
              href={ROUTES.signUp}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-surface-2 px-8 font-semibold text-text-primary transition-colors hover:bg-surface-3 active:scale-[0.98] sm:w-auto"
            >
              {"S'inscrire"}
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}