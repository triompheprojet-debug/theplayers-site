import { Sparkles, Trophy, Zap } from 'lucide-react'
import type { Metadata } from 'next'

import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Types d\u2019\u00e9v\u00e9nements — THE PLAYERS',
  description:
    'Hors Saison, Saison et Grande Finale : comprendre les trois formats de Liga Esport FC.',
}

const EVENT_TYPES = [
  {
    type: 'off_season' as const,
    icon: Sparkles,
    title: 'Hors Saison',
    points: [
      'Tournoi découverte, ouvert à tous.',
      'Cash prize direct pour les vainqueurs.',
      'Aucun point de ligue attribué.',
      'Aucun impact sur le classement de Saison.',
    ],
  },
  {
    type: 'season' as const,
    icon: Zap,
    title: 'Saison',
    points: [
      'Tournois officiels comptant pour la ligue.',
      'Distribuent des points de classement.',
      'Permettent de se qualifier à la Grande Finale.',
      'La qualification dépend du seuil de points configuré.',
    ],
  },
  {
    type: 'grand_final' as const,
    icon: Trophy,
    title: 'Grande Finale',
    points: [
      'Événement premium distinct des tournois de Saison.',
      'Réservé aux joueurs qualifiés.',
      'Cash prize majoré.',
      'Conclut une Saison.',
    ],
  },
]

export default async function EventTypesPage() {
  const active = await getActiveTournamentPublic()

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-text-primary md:text-4xl">
          Nos types d&apos;événements
        </h1>
        <p className="max-w-2xl text-sm text-text-secondary">
          Liga Esport FC propose trois formats. Chacun a ses propres règles de
          classement et de qualification.
        </p>
        {active && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>Événement actif :</span>
            <TournamentTypeBadge type={active.tournament_type} />
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {EVENT_TYPES.map((event) => (
          <article
            key={event.type}
            className="flex flex-col gap-4 rounded-2xl bg-surface-1 p-6"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-surface-2 text-accent-violet">
              <event.icon className="size-6" aria-hidden />
            </span>
            <TournamentTypeBadge type={event.type} className="self-start" />
            <ul className="space-y-2">
              {event.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-2 text-sm text-text-secondary"
                >
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-violet"
                    aria-hidden
                  />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="mt-8 rounded-2xl bg-surface-1 p-5 text-sm text-text-secondary">
        À noter : les tournois Hors Saison sont entièrement indépendants du
        classement de Saison. Y participer n&apos;affecte ni vos points ni votre
        qualification.
      </p>
    </section>
  )
}