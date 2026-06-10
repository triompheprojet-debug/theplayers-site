import { Clock, Gauge, Timer, type LucideIcon } from 'lucide-react'

import type { PublicTournamentConfig } from './config'

interface FormatTabProps {
  game: PublicTournamentConfig['game']
  match: PublicTournamentConfig['match']
}

export function FormatTab({ game, match }: FormatTabProps) {
  const cards: Array<{ icon: LucideIcon; text: string }> = []
  if (match) {
    cards.push({ icon: Timer, text: `${match.half_minutes} min / mi-temps` })
    cards.push({ icon: Clock, text: `${match.duration_minutes} min / match` })
  }
  if (game) {
    cards.push({ icon: Gauge, text: `niveau · ${game.difficulty}` })
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-accent-violet md:text-3xl">
        Format du Tournoi
      </h2>

      <div className="rounded-2xl bg-surface-1 p-6">
        <p className="text-sm leading-relaxed text-text-secondary">
          {'Le tournoi se déroule sous un format à '}
          <strong className="font-semibold text-text-primary">
            élimination directe
          </strong>
          {". Chaque match compte. Une défaite et c'est terminé. Assurez-vous d'être prêt avant le coup d'envoi."}
        </p>

        {cards.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.text}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-2 p-5 text-center"
              >
                <card.icon className="size-8 text-accent-violet" aria-hidden />
                <span className="font-mono text-xs font-medium uppercase tracking-wide text-text-primary">
                  {card.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-surface-1 p-5">
        <h3 className="text-xs uppercase tracking-widest text-text-secondary">
          Arbre du tournoi
        </h3>
        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-120 items-center justify-between gap-3 font-mono text-xs uppercase tracking-wide text-text-secondary">
            <div className="flex flex-col gap-3">
              <span className="rounded-md bg-surface-2 px-3 py-2">1/4 de finale</span>
              <span className="rounded-md bg-surface-2 px-3 py-2">1/4 de finale</span>
            </div>
            <span className="h-px w-6 shrink-0 bg-accent-violet/50" aria-hidden />
            <span className="rounded-lg bg-accent-violet/15 px-4 py-3 font-semibold text-accent-violet shadow-glow-violet">
              Demi-finale
            </span>
            <span className="h-px w-6 shrink-0 bg-accent-violet/50" aria-hidden />
            <span className="rounded-lg bg-surface-2 px-5 py-4 font-semibold text-text-primary">
              Grande finale
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}