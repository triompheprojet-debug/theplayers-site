import { Gamepad2, Monitor, Timer } from 'lucide-react'

import type { PublicTournamentConfig } from './config'

interface FormatTabProps {
  game: PublicTournamentConfig['game']
  match: PublicTournamentConfig['match']
  consoles: PublicTournamentConfig['consoles']
}

/**
 * Onglet Format : jeu / plateforme / difficulté, consoles, durée de match.
 * Server Component (aucune interactivité). No-Line, aucun emoji.
 */
export function FormatTab({ game, match, consoles }: FormatTabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {game && (
        <InfoCard icon={Gamepad2} title="Jeu">
          <Row label="Titre" value={game.name} />
          <Row label="Plateforme" value={game.platform} />
          <Row label="Difficulté" value={game.difficulty} />
        </InfoCard>
      )}

      {consoles && (
        <InfoCard icon={Monitor} title="Consoles">
          <Row label="En service" value={`${consoles.active_count}`} />
        </InfoCard>
      )}

      {match && (
        <InfoCard icon={Timer} title="Match">
          <Row label="Durée" value={`${match.duration_minutes} min`} />
          <Row label="Mi-temps" value={`${match.half_minutes} min`} />
          <Row label="Pause" value={`${match.break_minutes} min`} />
        </InfoCard>
      )}
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Gamepad2
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon className="size-4 shrink-0" aria-hidden />
        <h3 className="text-xs uppercase tracking-wider">{title}</h3>
      </div>
      <dl className="mt-3 space-y-2">{children}</dl>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium text-text-primary">{value}</dd>
    </div>
  )
}