import type { ReactNode } from 'react'

import { PlayerBottomNav } from '@/components/layout/PlayerBottomNav'

/**
 * Layout de l'espace joueur (mobile-first).
 *
 * Le gate d'authentification `/joueur/*` est assuré par `src/middleware.ts`
 * (M06) : inutile de revérifier la session ici. Chaque page lit son propre
 * profil via le client serveur pour afficher les données.
 *
 * `max-w-lg` borne la largeur sur grand écran (l'app reste pensée pour 375px).
 * `pb-24` réserve la place de la `PlayerBottomNav` fixe (h-16 + marge).
 */
export default function PlayerLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-lg px-4 pb-24 pt-6">
        {children}
      </main>
      <PlayerBottomNav />
    </div>
  )
}