/**
 * Layout de l'espace arbitre (mobile-first).
 *
 * - Garde d'auth + rôle : super_admin, admin ou referee (auth admin custom,
 *   PAS Supabase Auth). Le middleware filtre déjà /arbitre/* ; cette garde est
 *   la défense en profondeur côté serveur.
 * - En-tête léger : badge « Arbitre » (accent orange) + identifiant connecté.
 * - RefereeTopNav (3 onglets) puis le contenu.
 *
 * Aucun emoji (icônes Lucide). Accent orange `referee`.
 */
import type { ReactNode } from 'react'

import { RefereeTopNav } from '@/components/layout/RefereeTopNav'
import { requireAdminRole } from '@/lib/auth/permissions'

export default async function RefereeLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requireAdminRole(['super_admin', 'admin', 'referee'])

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {/* En-tête identité arbitre */}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 pt-4">
        <span className="rounded-md bg-referee/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-referee">
          Arbitre
        </span>
        <span className="text-sm font-semibold text-text-primary">
          {session.username}
        </span>
      </header>

      <RefereeTopNav />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">{children}</div>
      </main>
    </div>
  )
}