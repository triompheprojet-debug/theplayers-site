import { Activity } from 'lucide-react'

/**
 * Flux d'activité récent du back-office (M10).
 * Lecture seule de `activity_log` (déjà résolu côté page en service_role).
 */
export interface ActivityEntry {
  id: string
  actionType: string
  description: string | null
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  payment_confirmed: 'Paiement confirmé',
  payment_rejected: 'Paiement rejeté',
  manual_registration: 'Inscription manuelle',
  tournament_created: 'Tournoi créé',
  season_created: 'Saison créée',
  set_active_tournament: 'Tournoi actif modifié',
  registrations_toggled: 'Inscriptions (ouverture/fermeture)',
}

function actionLabel(type: string): string {
  return ACTION_LABELS[type] ?? type.replace(/_/g, ' ')
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section className="rounded-xl bg-surface-1 border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="size-4 text-accent-violet" aria-hidden />
        <h2 className="text-sm font-semibold text-text-primary">
          Activité récente
        </h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-text-secondary">Aucune activité récente.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3">
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-violet"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">
                  {actionLabel(entry.actionType)}
                </p>
                {entry.description && (
                  <p className="truncate text-xs text-text-secondary">
                    {entry.description}
                  </p>
                )}
              </div>
              <time
                className="shrink-0 text-xs text-text-secondary tabular-nums"
                dateTime={entry.createdAt}
              >
                {dateFormatter.format(new Date(entry.createdAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}