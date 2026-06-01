/**
 * Section "À venir" réutilisable (M04).
 *
 * Réserve un emplacement stylé pour les blocs enrichis plus tard
 * (paiements en attente → M10, statistiques → M19/M21).
 * Respecte la règle No-Line : séparation par tons de surface, pas de bordure.
 */
import type { LucideIcon } from 'lucide-react'

interface PlaceholderSectionProps {
  title: string
  description: string
  icon: LucideIcon
}

export function PlaceholderSection({
  title,
  description,
  icon: Icon,
}: PlaceholderSectionProps) {
  return (
    <section className="rounded-xl bg-surface-1 p-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] uppercase tracking-wider text-text-secondary">
              À venir
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
      </div>
    </section>
  )
}