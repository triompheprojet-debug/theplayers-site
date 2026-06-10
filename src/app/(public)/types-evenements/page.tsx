import {
  ArrowRight,
  Award,
  Compass,
  Gamepad2,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'

import { cn } from '@/lib/utils'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Types d\u2019\u00e9v\u00e9nements — THE PLAYERS',
  description:
    'Hors Saison, Saison et Grande Finale : comprendre les trois formats de Liga Esport FC.',
}

type Tt = 'off_season' | 'season' | 'grand_final'

const ACCENT: Record<Tt, { text: string; chip: string }> = {
  off_season: { text: 'text-success-neon', chip: 'bg-success-neon/10' },
  season: { text: 'text-accent-violet', chip: 'bg-accent-violet/10' },
  grand_final: { text: 'text-warning', chip: 'bg-warning/10' },
}

interface EventType {
  type: Tt
  icon: LucideIcon
  label: string
  title: string
  featured?: boolean
  points: Array<{ text: string; warn?: boolean }>
}

const EVENT_TYPES: EventType[] = [
  {
    type: 'off_season',
    icon: Compass,
    label: 'Indépendant',
    title: 'Hors Saison',
    points: [
      { text: 'Tournoi découverte ouvert à tous les niveaux.' },
      { text: 'Cash prize direct pour les vainqueurs.' },
      { text: 'Aucun point de ligue attribué.', warn: true },
    ],
  },
  {
    type: 'season',
    icon: Gamepad2,
    label: 'Officiel',
    title: 'Saison régulière',
    featured: true,
    points: [
      { text: 'Tournois officiels du circuit.' },
      { text: 'Gains de points de ligue pour le classement général.' },
      { text: 'Voie principale de qualification pour la Grande Finale.' },
    ],
  },
  {
    type: 'grand_final',
    icon: Award,
    label: 'Premium',
    title: 'Grande Finale',
    points: [
      { text: 'Événement premium de fin de saison.' },
      { text: 'Conditions strictes de qualification (top classement).' },
      { text: "Le plus gros cash prize de l'année." },
    ],
  },
]

export default async function EventTypesPage() {
  const active = await getActiveTournamentPublic()

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-accent-violet drop-shadow-[0_0_15px_rgba(139,92,246,0.4)] md:text-5xl">
          Circuit compétitif
        </h1>
        <p className="mt-4 text-sm text-text-secondary md:text-base">
          Découvrez la structure des événements de Liga Esport FC, de la
          découverte à la consécration ultime.
        </p>
      </header>

      <div className="mt-10 grid items-start gap-4 md:grid-cols-3">
        {EVENT_TYPES.map((event) => {
          const accent = ACCENT[event.type]
          const isActive = active?.tournament_type === event.type

          return (
            <article
              key={event.type}
              className={cn(
                'relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl bg-surface-1 p-6',
                event.featured && 'shadow-glow-violet md:-translate-y-2',
              )}
            >
              {event.featured && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-0.5 bg-accent-violet"
                />
              )}

              <header className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex size-12 shrink-0 items-center justify-center rounded-full',
                    accent.chip,
                    accent.text,
                  )}
                >
                  <event.icon className="size-6" aria-hidden />
                </span>
                <div>
                  <span
                    className={cn(
                      'block text-[11px] font-semibold uppercase tracking-widest',
                      accent.text,
                    )}
                  >
                    {event.label}
                  </span>
                  <h2 className="text-lg font-bold uppercase text-text-primary">
                    {event.title}
                  </h2>
                </div>
              </header>

              <ul className="flex flex-1 flex-col gap-2">
                {event.points.map((point) => (
                  <li
                    key={point.text}
                    className={cn(
                      'flex items-start gap-2 text-sm',
                      point.warn
                        ? 'font-semibold text-danger'
                        : 'text-text-secondary',
                    )}
                  >
                    {point.warn ? (
                      <X className="mt-0.5 size-4 shrink-0" aria-hidden />
                    ) : (
                      <ArrowRight
                        className={cn('mt-0.5 size-4 shrink-0', accent.text)}
                        aria-hidden
                      />
                    )}
                    {point.text}
                  </li>
                ))}
              </ul>

              {isActive && (
                <div>
                  <div className="h-px bg-surface-2" aria-hidden />
                  <p
                    className={cn(
                      'mt-3 font-mono text-xs font-semibold uppercase',
                      accent.text,
                    )}
                  >
                    Statut : Actif
                  </p>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl bg-surface-1 p-5">
        <Info className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden />
        <p className="font-mono text-xs leading-relaxed text-text-secondary">
          {"Note : les tournois Hors Saison sont totalement indépendants du classement de la Saison régulière et n'impactent pas l'éligibilité à la Grande Finale."}
        </p>
      </div>
    </section>
  )
}