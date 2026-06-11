import { Network } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'

export const metadata = {
  title: 'Bracket — THE PLAYERS',
}

export default function BracketPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <EmptyState
        icon={Network}
        title="Bracket bientôt disponible"
        description="L'arbre du tournoi et les résultats des matchs s'afficheront ici dès le lancement de la compétition. Reviens le jour J pour suivre la progression en direct."
      />
    </div>
  )
}