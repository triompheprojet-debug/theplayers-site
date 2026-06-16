import { History } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { getHistoryEditions } from '@/lib/historique/get'

import { EditionCard } from './components/EditionCard'
import { SeasonAccordion } from './components/SeasonAccordion'

export const metadata = {
  title: 'Historique — THE PLAYERS',
}

export const dynamic = 'force-dynamic'

const MONTH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Brazzaville',
})

function monthYear(date: string): string {
  return MONTH_YEAR.format(new Date(date))
}

function seasonRange(start: string, end: string | null): string {
  const from = monthYear(start)
  return end ? `${from} – ${monthYear(end)}` : from
}

export default async function HistoriquePage() {
  const editions = await getHistoryEditions()

  if (editions.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          icon={History}
          title="Historique à venir"
          description="Les éditions passées et leurs vainqueurs seront archivés ici au fil des saisons."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-text-primary">Historique</h1>
        <p className="text-sm text-text-secondary">
          Éditions passées et leurs vainqueurs.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {editions.map((edition) =>
          edition.kind === 'season' ? (
            <SeasonAccordion
              key={edition.slug}
              edition={edition}
              dateLabel={seasonRange(edition.startDate, edition.endDate)}
            />
          ) : (
            <EditionCard
              key={edition.slug}
              edition={edition}
              dateLabel={monthYear(edition.startDate)}
            />
          ),
        )}
      </div>
    </div>
  )
}