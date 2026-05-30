/**
 * Table des éditions admin (M03.D).
 *
 * Server Component (pas d'interactivité au niveau ligne — clic → Link).
 *
 * Affiche un mix de :
 *  - Tournois Hors Saison (autonomes, lien vers détail tournoi — M03.G+)
 *  - Saisons (lien vers détail saison qui liste les tournois enfants — M03.G)
 *
 * Colonnes : Type, Nom, Période, Statut, Tournois (n/N pour saisons), Action
 */
import { CalendarPlus, ListPlus, Trophy } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
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

interface EditionsTableProps {
  editions: Edition[]
  /** Si true, l'EmptyState propose les CTA de création. */
  canCreate: boolean
}

export function EditionsTable({ editions, canCreate }: EditionsTableProps) {
  // ─── État vide ──────────────────────────────────────────────────────
  if (editions.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aucune édition pour l'instant"
        description={
          canCreate
            ? 'Crée une première édition pour commencer : Hors Saison pour un tournoi unique, ou Saison pour un cycle complet.'
            : 'Aucune édition n\'a encore été créée par un Super Admin.'
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
    )
  }

  // ─── Table ──────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface-1',
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/40">
            <Th>Type</Th>
            <Th>Nom</Th>
            <Th>Période</Th>
            <Th>Statut</Th>
            <Th>Tournois</Th>
            <Th className="text-right pr-6">Action</Th>
          </tr>
        </thead>
        <tbody>
          {editions.map((edition) => (
            <EditionRow
              key={editionKey(edition)}
              edition={edition}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===========================================================================
// Ligne d'édition (rendu polymorphe HS vs Saison)
// ===========================================================================
function EditionRow({ edition }: { edition: Edition }) {
  if (edition.kind === 'off_season') {
    const t = edition.tournament
    // Lien vers le détail tournoi — page n'existe pas encore en M03,
    // on pointe vers la page de modification éventuelle ou un fallback.
    // Pour M03.D on garde simplement la racine /admin/editions ; le détail
    // tournoi HS arrivera en module ultérieur (édition de tournoi).
    return (
      <tr className="border-b border-border last:border-0">
        <Td><TournamentTypeBadge type="off_season" /></Td>
        <Td className="font-semibold text-text-primary">{t.name}</Td>
        <Td>
          <DateBadge from={t.start_date} to={t.end_date} />
        </Td>
        <Td>{renderTournamentStatus(t.status)}</Td>
        <Td>
          <span className="text-text-secondary">—</span>
        </Td>
        <Td className="text-right pr-6">
          <span className="text-xs text-text-secondary italic">
            Détail à venir
          </span>
        </Td>
      </tr>
    )
  }

  // kind === 'season'
  const s = edition.season
  return (
    <tr className="border-b border-border last:border-0">
      <Td>
        <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
          Saison {s.season_number}
        </Badge>
      </Td>
      <Td className="font-semibold text-text-primary">{s.name}</Td>
      <Td>
        <DateBadge from={s.start_date} to={s.end_date} />
      </Td>
      <Td>{renderSeasonStatus(s.status as SeasonStatus)}</Td>
      <Td>
        <span className="tabular-nums text-text-secondary">
          {edition.tournamentsCount} / {s.expected_tournaments}
        </span>
      </Td>
      <Td className="text-right pr-6">
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.admin.editions.seasonDetail(s.id)}>
            Voir
          </Link>
        </Button>
      </Td>
    </tr>
  )
}

// ===========================================================================
// Rendu des statuts
// ===========================================================================
function renderTournamentStatus(status: TournamentStatus) {
  const map: Record<TournamentStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }> = {
    draft:                 { label: 'Brouillon',           variant: 'outline' },
    registrations_open:    { label: 'Inscriptions ouvertes', variant: 'default' },
    registrations_closed:  { label: 'Inscriptions closes',   variant: 'secondary' },
    in_progress:           { label: 'En cours',              variant: 'default' },
    completed:             { label: 'Terminé',               variant: 'secondary' },
    archived:              { label: 'Archivé',               variant: 'ghost' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function renderSeasonStatus(status: SeasonStatus) {
  const map: Record<SeasonStatus, { label: string; variant: 'default' | 'secondary' | 'ghost' }> = {
    active:    { label: 'Active',    variant: 'default' },
    completed: { label: 'Terminée',  variant: 'secondary' },
    archived:  { label: 'Archivée',  variant: 'ghost' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ===========================================================================
// Helpers tableau
// ===========================================================================
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
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

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-6 py-3 align-middle', className)}>{children}</td>
  )
}

// ===========================================================================
// Helper de clé React pour l'union discriminée
// ===========================================================================
function editionKey(edition: Edition): string {
  return edition.kind === 'off_season'
    ? `os-${edition.tournament.id}`
    : `se-${edition.season.id}`
}