import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

export const metadata = {
  title: 'Classement — THE PLAYERS',
}

export default function ClassementPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <EmptyState
        icon={Trophy}
        title="Classement à venir"
        description="Le classement des joueurs sera publié ici pendant et après la compétition. Inscris-toi pour y figurer."
      />
    </div>
  )
}