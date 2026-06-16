import Link from 'next/link'
import { ChevronRight, Crown, Flame } from 'lucide-react'

import { ROUTES } from '@/config/routes'

import type { HistoryOffSeasonEdition } from '@/lib/historique/get'

/**
 * Carte d'une édition hors-saison (Historique). Lien vers le détail (son
 * classement figé). Accent orange (espace hors-saison). Pseudos uniquement.
 */
export function EditionCard({
  edition,
  dateLabel,
}: {
  edition: HistoryOffSeasonEdition
  dateLabel: string
}) {
  return (
    <Link
      href={ROUTES.historyDetail(edition.slug)}
      className="flex items-center gap-3 rounded-2xl bg-surface-1 px-4 py-3.5 transition-colors hover:bg-surface-2 active:scale-[0.99]"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: '#2a2118', color: '#ff9933' }}
      >
        <Flame className="size-5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block text-[10px] font-medium uppercase tracking-wider"
          style={{ color: '#ff9933' }}
        >
          Hors-saison
        </span>
        <span className="block truncate text-[15px] font-semibold text-text-primary">
          {edition.name}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          {dateLabel}
          {edition.championPseudo && (
            <>
              <span aria-hidden>·</span>
              <Crown className="size-3" style={{ color: '#f5c518' }} aria-hidden />
              <span className="truncate text-text-secondary">
                {edition.championPseudo}
              </span>
            </>
          )}
        </span>
      </span>

      <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
    </Link>
  )
}