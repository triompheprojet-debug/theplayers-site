/**
 * Page de création d'une saison (M03.F).
 *
 * - Permission : SUPER_ADMIN uniquement.
 * - Formulaire simple (6 champs), pas de pré-remplissage depuis app_config
 *   (une saison n'hérite pas des defaults de tournoi).
 * - Le formulaire est un Client Component (react-hook-form).
 */
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireSuperAdmin } from '@/lib/auth/permissions'

import { SeasonForm } from '../../components/SeasonForm'

export const metadata = {
  title: 'Nouvelle saison — Administration',
  robots: { index: false, follow: false },
}

export default async function NewSeasonPage() {
  // Garde d'auth — redirige si non SUPER_ADMIN
  await requireSuperAdmin()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ─── En-tête ─────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={ROUTES.admin.editions.root}>
            <ChevronLeft aria-hidden />
            Retour aux éditions
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Nouvelle saison
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Cycle complet regroupant plusieurs tournois et une Grande Finale.
            Les tournois seront ajoutés ensuite depuis le détail de la saison.
          </p>
        </div>
      </header>

      {/* ─── Formulaire ─────────────────────────────────────────────── */}
      <SeasonForm />
    </div>
  )
}
