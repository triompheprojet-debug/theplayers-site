/**
 * Liste des éditions (M03.D) — refonte présentationnelle.
 * Server Component : charge listEditions(). Garde portée par (protected)/layout.
 * CTA "Nouvelle…" réservés au SUPER_ADMIN.
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
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary md:text-3xl">
            Éditions & Saisons
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Vue globale du calendrier des tournois et gestion des saisons.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" size="sm" className="uppercase">
              <Link href={ROUTES.admin.editions.newOffSeason}>
                <CalendarPlus aria-hidden />
                Nouvelle Hors Saison
              </Link>
            </Button>
            <Button asChild size="sm" className="uppercase">
              <Link href={ROUTES.admin.editions.newSeason}>
                <ListPlus aria-hidden />
                Nouvelle Saison
              </Link>
            </Button>
          </div>
        )}
      </header>

      <EditionsTable editions={editions} canCreate={isSuperAdmin} />
    </div>
  )
}