/**
 * Layout des pages admin protégées.
 *
 * Toutes les pages sous `src/app/admin/(protected)/*` héritent de :
 *   - AdminRedLine (ligne rouge fine en haut)
 *   - AdminSidebar (navigation desktop, profil, déconnexion)
 *   - AdminTopBar (contexte tournoi actif)
 *   - Garde `requireAdmin()` (redirect /admin/login si pas de session)
 *
 * Le Route Group `(protected)/` n'apparaît pas dans les URLs :
 *   - /admin/dashboard         ← fichier sous (protected)/dashboard/
 *   - /admin/editions/saisons  ← fichier sous (protected)/editions/saisons/
 *
 * Les pages PUBLIQUES (login, logout) restent à la racine de /admin/ et
 * n'héritent PAS de ce layout — pas de boucle de redirection.
 */
import type { ReactNode } from 'react'

import { AdminRedLine } from '@/components/layout/AdminRedLine'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminTopBar } from '@/components/layout/AdminTopBar'
import { requireAdmin } from '@/lib/auth/permissions'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // Garde d'auth : si pas de session valide → redirect /admin/login
  const session = await requireAdmin()

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminRedLine />
      <AdminSidebar username={session.username} role={session.role} />
      <AdminTopBar />

      <main className="ml-66 not-first:pt-16 min-h-screen">
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  )
}