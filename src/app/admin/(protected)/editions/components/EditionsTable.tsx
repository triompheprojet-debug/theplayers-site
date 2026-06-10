/**
 * Liste des éditions en cartes (M03.D) — refonte présentationnelle.
 * Server Component (clic → Link). Mix Hors Saison + Saisons.
 * Tonalité de carte pilotée par le statut réel (live / normal / atténué).
 */
import { CalendarPlus, ListPlus, Trophy } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { DateBadge } from '@/components/shared/DateBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import type { Edition } from '@/lib/seasons/list'

import type { Database } from '@/types/database.types'

type TournamentStatus = Database['public']['Enums']['tournament_status']
type SeasonStatus = 'active' | 'completed' | 'archived'
type Tone = 'live' | 'normal' | 'muted'

interface EditionsTableProps {
  editions: Edition[]
  /** Si true, l'EmptyState propose les CTA de création. */
  canCreate: boolean
}

export function EditionsTable({ editions, canCreate }: EditionsTableProps) {
  if (editions.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-1">
        <EmptyState
          icon={Trophy}
          title="Aucune édition pour l'instant"
          description={
            canCreate
              ? 'Crée une première édition pour commencer : Hors Saison pour un tournoi unique, ou Saison pour un cycle complet.'
              : "Aucune édition n'a encore été créée par un Super Admin."
          }
          action={
            canCreate ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.admin.editions.newOffSeason}>
                    <CalendarPlus aria-hidden />
                    Hors Saison
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={ROUTES.admin.editions.newSeason}>
                    <ListPlus aria-hidden />
                    Saison
                  </Link>
                </Button>
              </div>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {editions.map((edition) => (
        <EditionCard key={editionKey(edition)} edition={edition} />
      ))}
    </div>
  )
}

// ===========================================================================
// Carte d'édition (rendu polymorphe HS vs Saison)
// ===========================================================================
function EditionCard({ edition }: { edition: Edition }) {
  if (edition.kind === 'off_season') {
    const t = edition.tournament
    return (
      <CardShell tone={tournamentTone(t.status)}>
        <CardMain
          badge={<TournamentTypeBadge type="off_season" />}
          pill={tournamentStatusPill(t.status)}
          name={t.name}
          from={t.start_date}
          to={t.end_date}
        />
        <div className="flex shrink-0 items-center justify-end">
          <span className="text-xs italic text-text-muted">Détail à venir</span>
        </div>
      </CardShell>
    )
  }

  const s = edition.season
  return (
    <CardShell tone={seasonTone(s.status as SeasonStatus)}>
      <CardMain
        badge={
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Saison {s.season_number}
          </span>
        }
        pill={seasonStatusPill(s.status as SeasonStatus)}
        name={s.name}
        from={s.start_date}
        to={s.end_date}
      />
      <div className="flex shrink-0 items-center gap-5">
        <div className="hidden text-right sm:block">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
            Tournois
          </p>
          <p className="font-mono text-sm tabular-nums text-text-primary">
            {edition.tournamentsCount} / {s.expected_tournaments}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.admin.editions.seasonDetail(s.id)}>Détails</Link>
        </Button>
      </div>
    </CardShell>
  )
}

// ===========================================================================
// Coque + contenu principal
// ===========================================================================
function CardShell({
  tone,
  children,
}: {
  tone: Tone
  children: React.ReactNode
}) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl bg-surface-1 p-5 md:p-6',
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        tone === 'live' &&
          "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent-violet before:content-['']",
        tone === 'muted' && 'opacity-60',
      )}
    >
      {children}
    </article>
  )
}

function CardMain({
  badge,
  pill,
  name,
  from,
  to,
}: {
  badge: React.ReactNode
  pill: { label: string; className: string }
  name: string
  from: string
  to: string
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {badge}
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            pill.className,
          )}
        >
          {pill.label}
        </span>
      </div>
      <h2 className="truncate text-lg font-semibold text-text-primary">
        {name}
      </h2>
      <DateBadge from={from} to={to} className="text-xs uppercase" />
    </div>
  )
}

// ===========================================================================
// Pastilles de statut + tonalités (données réelles)
// ===========================================================================
function tournamentStatusPill(status: TournamentStatus): {
  label: string
  className: string
} {
  const map: Record<TournamentStatus, { label: string; className: string }> = {
    draft: { label: 'Brouillon', className: 'bg-surface-2 text-text-secondary' },
    registrations_open: {
      label: 'Inscriptions ouvertes',
      className: 'bg-accent-violet/15 text-accent-violet',
    },
    registrations_closed: {
      label: 'Inscriptions closes',
      className: 'bg-surface-2 text-text-secondary',
    },
    in_progress: {
      label: 'En cours',
      className: 'bg-success-neon/15 text-success-neon',
    },
    completed: { label: 'Terminé', className: 'bg-surface-2 text-text-muted' },
    archived: { label: 'Archivé', className: 'bg-surface-2 text-text-muted' },
  }
  return map[status]
}

function seasonStatusPill(status: SeasonStatus): {
  label: string
  className: string
} {
  const map: Record<SeasonStatus, { label: string; className: string }> = {
    active: {
      label: 'Active',
      className: 'bg-accent-violet/15 text-accent-violet',
    },
    completed: { label: 'Terminée', className: 'bg-surface-2 text-text-muted' },
    archived: { label: 'Archivée', className: 'bg-surface-2 text-text-muted' },
  }
  return map[status]
}

function tournamentTone(status: TournamentStatus): Tone {
  if (status === 'registrations_open' || status === 'in_progress') return 'live'
  if (status === 'completed' || status === 'archived') return 'muted'
  return 'normal'
}

function seasonTone(status: SeasonStatus): Tone {
  if (status === 'active') return 'live'
  if (status === 'completed' || status === 'archived') return 'muted'
  return 'normal'
}

function editionKey(edition: Edition): string {
  return edition.kind === 'off_season'
    ? `os-${edition.tournament.id}`
    : `se-${edition.season.id}`
}