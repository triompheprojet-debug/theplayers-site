/**
 * TopBar admin (M03.B).
 *
 * Affiche le contexte actif (tournoi en vedette + dates) et signale
 * visuellement quand aucun tournoi n'est défini.
 *
 * Server Component : lit `getActiveTournamentForAdmin()` côté serveur.
 * Le bouton "Changer" interactif arrivera en M03.C (ActiveTournamentSwitcher,
 * Client + modale shadcn). Pour l'instant on rend juste l'état courant.
 *
 * Positionnement : fixed top, à droite de la sidebar (left-[264px]),
 * hauteur 64px (h-16), z-30.
 */
import { Calendar } from 'lucide-react'
import Link from 'next/link'

import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { ROUTES } from '@/config/routes'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'
import { cn } from '@/lib/utils'

export async function AdminTopBar() {
  const active = await getActiveTournamentForAdmin()

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-66 z-30 h-16',
        'flex items-center justify-between gap-4 px-6',
        'bg-surface-1 border-b border-border',
        'pt-0.5', // ne pas chevaucher AdminRedLine
      )}
    >
      {/* ─── Contexte actif ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-secondary shrink-0">
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

      {/* ─── Placeholder switcher (M03.C) ────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-text-secondary">
          {/* Bouton "Changer" branché en M03.C */}
        </span>
      </div>
    </header>
  )
}

// ===========================================================================
// Sous-composant : contexte affiché quand un tournoi est actif
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
// Sous-composant : aucun tournoi actif
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
// Format de plage de dates "DD MMM YYYY → DD MMM YYYY" en français
// ===========================================================================
function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  // Les dates DB sont au format YYYY-MM-DD ; Date() les parse en UTC.
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`
}