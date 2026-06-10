/**
 * Tournois rattachés à une saison (M03.G) — refonte en cartes, No-Line.
 * Server Component. Affiche les tournois enfants (season + grand_final).
 * Tonalité pilotée par le statut réel ; Grande Finale marquée par une couronne.
 */
import { Crown, Trophy } from 'lucide-react'

import { DateBadge } from '@/components/shared/DateBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { cn } from '@/lib/utils'
import type { SeasonTournament } from '@/lib/tournaments/list-by-season'

import type { Database } from '@/types/database.types'

type TournamentStatus = Database['public']['Enums']['tournament_status']
type Tone = 'live' | 'normal' | 'muted'

interface SeasonTournamentsTableProps {
  tournaments: SeasonTournament[]
}

export function SeasonTournamentsTable({
  tournaments,
}: SeasonTournamentsTableProps) {
  if (tournaments.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-1">
        <EmptyState
          icon={Trophy}
          title="Aucun tournoi dans cette saison"
          description="Ajoute le premier tournoi de la saison via le bouton ci-dessus."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {tournaments.map((t) => {
        const pill = statusPill(t.status)
        const tone = statusTone(t.status)
        const isGrandFinal = t.tournament_type === 'grand_final'

        return (
          <article
            key={t.id}
            className={cn(
              'relative flex items-center gap-4 overflow-hidden rounded-2xl bg-surface-1 p-4 md:p-5',
              tone === 'live' &&
                "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent-violet before:content-['']",
              tone === 'muted' && 'opacity-60',
            )}
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 font-mono text-sm font-semibold tabular-nums text-text-secondary">
              {isGrandFinal ? (
                <Crown
                  className="size-4 text-accent-violet"
                  aria-label="Grande Finale"
                />
              ) : (
                (t.tournament_number ?? '—')
              )}
            </span>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <TournamentTypeBadge type={t.tournament_type} />
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    pill.className,
                  )}
                >
                  {pill.label}
                </span>
              </div>
              <h3 className="truncate font-semibold text-text-primary">
                {t.name}
              </h3>
              <DateBadge
                from={t.start_date}
                to={t.end_date}
                className="text-xs uppercase"
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}

// ===========================================================================
// Statut → pastille + tonalité
// ===========================================================================
function statusPill(status: TournamentStatus): {
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

function statusTone(status: TournamentStatus): Tone {
  if (status === 'registrations_open' || status === 'in_progress') return 'live'
  if (status === 'completed' || status === 'archived') return 'muted'
  return 'normal'
}