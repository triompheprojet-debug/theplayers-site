/**
 * Page liste des éditions (M03.D).
 *
 * Page principale d'entrée pour la gestion des saisons + tournois Hors Saison
 * + Grandes Finales depuis l'admin.
 *
 * Server Component : charge `listEditions()` côté serveur, transmet à la table.
 * Permission : tout admin connecté (la garde est portée par (protected)/layout.tsx).
 * Mais les CTA "Nouvelle..." ne s'affichent que pour SUPER_ADMIN.
 */
import { CalendarPlus, ListPlus } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { listEditions } from '@/lib/seasons/list'

import { EditionsTable } from './components/EditionsTable'

export const metadata = {
  title: 'Éditions — Administration',
  robots: { index: false, follow: false },
}

export default async function EditionsPage() {
  const [session, editions] = await Promise.all([
    requireAdmin(),
    listEditions(),
  ])

  const isSuperAdmin = session.role === 'super_admin'

  return (
    <div className="space-y-6">
      {/* ─── En-tête ─────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Éditions</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Toutes les saisons et tournois Hors Saison, du plus récent au plus
            ancien.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.admin.editions.newOffSeason}>
                <CalendarPlus aria-hidden />
                Nouvelle Hors Saison
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={ROUTES.admin.editions.newSeason}>
                <ListPlus aria-hidden />
                Nouvelle Saison
              </Link>
            </Button>
          </div>
        )}
      </header>

      {/* ─── Table ──────────────────────────────────────────────────── */}
      <EditionsTable editions={editions} canCreate={isSuperAdmin} />
    </div>
  )
}