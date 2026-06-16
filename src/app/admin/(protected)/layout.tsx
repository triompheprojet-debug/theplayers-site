/**
 * Layout des pages admin protégées.
 *
 * Toutes les pages sous `src/app/admin/(protected)/*` héritent de :
 *   - AdminRedLine (ligne rouge fine en haut)
 *   - AdminSidebar (navigation desktop, profil, déconnexion)
 *   - AdminTopBar (contexte tournoi actif)
 *   - Garde `requireAdminRole(['super_admin', 'admin'])`
 *
 * Le back-office est réservé à super_admin et admin. Un compte purement
 * arbitre (role=referee) est filtré en amont par le middleware (redirigé vers
 * /arbitre) ; cette garde sert de défense en profondeur (si le middleware
 * venait à ne pas matcher une route) et renvoie alors le referee vers son
 * espace dédié via adminHomeRoute, sans boucle.
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
import { requireAdminRole } from '@/lib/auth/permissions'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // Garde d'auth + rôle : session valide ET rôle back-office (sa/admin).
  // Sinon redirige (login si absent, /arbitre si referee).
  const session = await requireAdminRole(['super_admin', 'admin'])

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