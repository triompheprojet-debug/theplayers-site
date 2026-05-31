/**
 * Table des tournois rattachés à une saison (M03.G).
 *
 * Server Component. Affiche les tournois enfants (season + grand_final),
 * avec EmptyState si aucun.
 */
import { Trophy } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { DateBadge } from '@/components/shared/DateBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { cn } from '@/lib/utils'
import type { SeasonTournament } from '@/lib/tournaments/list-by-season'

import type { Database } from '@/types/database.types'

type TournamentStatus = Database['public']['Enums']['tournament_status']

interface SeasonTournamentsTableProps {
  tournaments: SeasonTournament[]
}

export function SeasonTournamentsTable({
  tournaments,
}: SeasonTournamentsTableProps) {
  if (tournaments.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucun tournoi dans cette saison"
        description="Ajoute le premier tournoi de la saison via le bouton ci-dessus."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/40">
            <Th>N°</Th>
            <Th>Type</Th>
            <Th>Nom</Th>
            <Th>Période</Th>
            <Th>Statut</Th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((t) => (
            <tr key={t.id} className="border-b border-border last:border-0">
              <Td className="tabular-nums text-text-secondary">
                {t.tournament_number ?? '—'}
              </Td>
              <Td>
                <TournamentTypeBadge type={t.tournament_type} />
              </Td>
              <Td className="font-semibold text-text-primary">{t.name}</Td>
              <Td>
                <DateBadge from={t.start_date} to={t.end_date} />
              </Td>
              <Td>{renderStatus(t.status)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===========================================================================
// Statuts
// ===========================================================================
function renderStatus(status: TournamentStatus) {
  const map: Record<
    TournamentStatus,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'ghost' }
  > = {
    draft: { label: 'Brouillon', variant: 'outline' },
    registrations_open: { label: 'Inscriptions ouvertes', variant: 'default' },
    registrations_closed: { label: 'Inscriptions closes', variant: 'secondary' },
    in_progress: { label: 'En cours', variant: 'default' },
    completed: { label: 'Terminé', variant: 'secondary' },
    archived: { label: 'Archivé', variant: 'ghost' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ===========================================================================
// Helpers tableau
// ===========================================================================
function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-6 py-3 text-left',
        'text-[10px] uppercase tracking-wider font-semibold',
        'text-text-secondary',
        className,
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={cn('px-6 py-3 align-middle', className)}>{children}</td>
}