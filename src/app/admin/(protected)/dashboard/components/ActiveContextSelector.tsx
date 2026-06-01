/**
 * Carte "Tournoi actif" du dashboard (M04).
 *
 * Server Component présentationnel : affiche le tournoi actif (ou un état
 * vide) et réutilise le ActiveTournamentSwitcher (M03.C) pour la commutation.
 * Le switcher est SUPER_ADMIN-only et géré côté client.
 */
import { ActiveTournamentSwitcher } from '@/components/layout/ActiveTournamentSwitcher'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import type { AdminActiveTournament } from '@/lib/tournaments/active'
import type { SelectableTournament } from '@/lib/tournaments/list-selectable'

interface ActiveContextSelectorProps {
  active: AdminActiveTournament | null
  tournaments: SelectableTournament[]
}

export function ActiveContextSelector({
  active,
  tournaments,
}: ActiveContextSelectorProps) {
  return (
    <section className="rounded-xl bg-surface-1 p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Tournoi actif
        </p>
        <ActiveTournamentSwitcher
          currentActiveId={active?.id ?? null}
          tournaments={tournaments}
        />
      </div>

      <div className="mt-4">
        {active ? (
          <div className="flex min-w-0 items-center gap-3">
            <TournamentTypeBadge type={active.tournament_type} />
            <div className="min-w-0">
              <p
                className="truncate text-lg font-semibold text-text-primary"
                title={active.name}
              >
                {active.name}
              </p>
              <p className="text-sm text-text-secondary">
                {formatDateRange(active.start_date, active.end_date)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Aucun tournoi sélectionné. Choisissez-en un via « Changer », ou
            créez d&apos;abord une édition.
          </p>
        )}
      </div>
    </section>
  )
}

// "DD MMM YYYY → DD MMM YYYY"
function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`
}