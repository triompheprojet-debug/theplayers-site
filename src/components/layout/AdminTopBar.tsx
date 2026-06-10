/**
 * TopBar admin (refonte présentationnelle).
 * Server Component : lit le tournoi actif + la session. Affiche le contexte
 * actif ; le sélecteur (Client) reste réservé aux SUPER_ADMIN. No-Line.
 */
import { Calendar } from 'lucide-react'
import Link from 'next/link'

import { ActiveTournamentSwitcher } from '@/components/layout/ActiveTournamentSwitcher'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { getActiveTournamentId } from '@/lib/config/active-tournament'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'
import { listSelectableTournaments } from '@/lib/tournaments/list-selectable'
import { cn } from '@/lib/utils'

export async function AdminTopBar() {
  const [session, active, currentId, tournaments] = await Promise.all([
    requireAdmin(),
    getActiveTournamentForAdmin(),
    getActiveTournamentId(),
    listSelectableTournaments(),
  ])

  const canSwitch = session.role === 'super_admin'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-66 z-30 h-16',
        'flex items-center justify-between gap-4 px-6',
        'bg-surface-1 pt-0.5',
      )}
    >
      {/* ─── Contexte actif (gauche) ─────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
          Contexte actif
        </span>

        {active ? (
          <ActiveContext
            name={active.name}
            type={active.tournament_type}
            startDate={active.start_date}
            endDate={active.end_date}
          />
        ) : (
          <NoActiveContext />
        )}
      </div>

      {/* ─── Sélecteur (droite) — SUPER_ADMIN uniquement ─────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {canSwitch && (
          <ActiveTournamentSwitcher
            currentActiveId={currentId}
            tournaments={tournaments}
          />
        )}
      </div>
    </header>
  )
}

// ===========================================================================
// Contexte affiché quand un tournoi est actif
// ===========================================================================
interface ActiveContextProps {
  name: string
  type: 'off_season' | 'season' | 'grand_final'
  startDate: string
  endDate: string
}

function ActiveContext({ name, type, startDate, endDate }: ActiveContextProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <TournamentTypeBadge type={type} />
      <p
        className="text-sm font-semibold text-text-primary truncate max-w-[320px]"
        title={name}
      >
        {name}
      </p>
      <span
        className="hidden md:inline-flex items-center gap-1.5 text-xs text-text-secondary"
        aria-label="Dates"
      >
        <Calendar className="size-3.5" aria-hidden />
        {formatDateRange(startDate, endDate)}
      </span>
    </div>
  )
}

// ===========================================================================
// Aucun tournoi actif
// ===========================================================================
function NoActiveContext() {
  return (
    <div className="flex items-center gap-3">
      <span className="px-2.5 py-0.5 rounded-full bg-surface-2 text-text-secondary text-[10px] uppercase tracking-wider font-semibold">
        Aucun tournoi actif
      </span>
      <Link
        href={ROUTES.admin.editions.root}
        className="text-xs text-accent-violet hover:underline"
      >
        Gérer les éditions
      </Link>
    </div>
  )
}

// ===========================================================================
// Format de plage de dates
// ===========================================================================
function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`
}