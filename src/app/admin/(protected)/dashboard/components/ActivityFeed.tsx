import { History } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Flux d'activité récent du back-office (lecture seule de `activity_log`).
 * Pastille colorée selon le type, heure relative.
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
  toggle_registrations: 'Inscriptions (ouverture/fermeture)',
}

function actionLabel(type: string): string {
  return ACTION_LABELS[type] ?? type.replace(/_/g, ' ')
}

function dotClass(type: string): string {
  if (type.includes('confirm')) return 'bg-success-neon'
  if (type.includes('reject')) return 'bg-danger'
  return 'bg-accent-violet'
}

function relativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH} h`
  return `Il y a ${Math.round(diffH / 24)} j`
}

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section className="rounded-2xl bg-surface-1 p-5">
      <div className="flex items-center gap-2">
        <History className="size-4 text-accent-violet" aria-hidden />
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
          {"Flux d'activité"}
        </h2>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          Aucune activité récente.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  dotClass(entry.actionType),
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {actionLabel(entry.actionType)}
                </p>
                {entry.description && (
                  <p className="truncate text-xs text-text-secondary">
                    {entry.description}
                  </p>
                )}
              </div>
              <time
                className="shrink-0 font-mono text-xs tabular-nums text-text-secondary"
                dateTime={entry.createdAt}
              >
                {relativeTime(entry.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}