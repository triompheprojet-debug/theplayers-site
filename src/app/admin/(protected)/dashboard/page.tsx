import Link from 'next/link'

import { AdminRedLine } from '@/components/layout/AdminRedLine'
import { Button } from '@/components/ui/button'
import { requireAdmin } from '@/lib/auth/permissions'

export const metadata = {
  title: 'Tableau de bord — Admin',
  robots: { index: false, follow: false },
}

/**
 * Placeholder M02.E — Dashboard admin minimal.
 *
 * Sert uniquement à valider le flow de login. Le vrai dashboard
 * (sélecteur de tournoi actif, toggle inscriptions, etc.) arrivera
 * en M04 et écrasera complètement ce fichier.
 */
export default async function AdminDashboardPage() {
  const session = await requireAdmin()

  return (
    <main className="relative min-h-screen bg-surface-1 px-6 py-12">
      <AdminRedLine />

      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Tableau de bord
          </p>
          <h1 className="text-2xl font-bold text-text-primary">
            Bonjour, {session.username}
          </h1>
          <p className="text-sm text-text-secondary">
            Rôle : {session.role.replace('_', ' ')}
          </p>
        </header>

        <p className="text-sm text-text-secondary">
          Placeholder M02. Le vrai tableau de bord arrive en M04.
        </p>

        <div>
          <Button asChild variant="outline">
            <Link href="/admin/logout">Se déconnecter</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
