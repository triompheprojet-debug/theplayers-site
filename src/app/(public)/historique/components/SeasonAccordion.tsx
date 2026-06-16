'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Crown, ListOrdered } from 'lucide-react'

import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

import type { HistorySeasonEdition } from '@/lib/historique/get'

/**
 * Accordéon d'une saison archivée (Historique). Replié par défaut, déplié
 * d'office pour la saison en cours. Pseudos uniquement (Règle 2).
 */
export function SeasonAccordion({
  edition,
  dateLabel,
}: {
  edition: HistorySeasonEdition
  dateLabel: string
}) {
  const [open, setOpen] = useState(edition.isCurrent)

  return (
    <section className="overflow-hidden rounded-2xl bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-violet/15 text-sm font-semibold text-accent-violet">
          S{edition.seasonNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-text-primary">
            {edition.name}
          </span>
          <span className="block text-xs text-text-muted">
            {dateLabel} · {edition.tournamentsCount} tournoi
            {edition.tournamentsCount > 1 ? 's' : ''}
          </span>
        </span>
        {edition.isCurrent ? (
          <span className="shrink-0 rounded-lg bg-success-neon/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-success-neon">
            En cours
          </span>
        ) : (
          <span className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">
            Archivée
          </span>
        )}
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-text-muted transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <div className="flex items-center gap-1.5 px-4 pb-1 text-xs text-text-secondary">
        <Crown className="size-3.5" style={{ color: '#f5c518' }} aria-hidden />
        Champion ·{' '}
        <span className="font-medium text-text-primary">
          {edition.championPseudo ?? '—'}
        </span>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-2">
          <ul className="overflow-hidden rounded-xl bg-surface-2">
            {edition.tournaments.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-text-muted">
                Aucun tournoi.
              </li>
            ) : (
              edition.tournaments.map((t, index) => (
                <li
                  key={`${t.name}-${index}`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"
                >
                  <span className="min-w-0 truncate text-text-secondary">
                    {t.type === 'grand_final' ? 'Grande Finale' : t.name}
                  </span>
                  <span
                    className="shrink-0 font-medium text-text-primary"
                    style={
                      t.type === 'grand_final' ? { color: '#f5c518' } : undefined
                    }
                  >
                    {t.championPseudo ?? '—'}
                  </span>
                </li>
              ))
            )}
          </ul>

          <Link
            href={ROUTES.historyDetail(edition.slug)}
            className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-accent-violet font-medium text-text-on-accent transition-colors hover:bg-accent-violet-hover active:scale-[0.98]"
          >
            <ListOrdered className="size-4" aria-hidden />
            Voir le classement
          </Link>
        </div>
      )}
    </section>
  )
}