import { History } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

export const metadata = {
  title: 'Historique — THE PLAYERS',
}

export default function HistoriquePage() {
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