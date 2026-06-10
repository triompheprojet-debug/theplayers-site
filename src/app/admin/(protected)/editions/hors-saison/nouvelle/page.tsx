/**
 * Page de création d'un tournoi Hors Saison (M03.E).
 *
 * - Permission : SUPER_ADMIN uniquement (CTA déjà filtré côté EditionsTable
 *   mais on re-garde ici en défense en profondeur).
 * - Pré-charge `tournament_defaults` + `event_location` depuis app_config
 *   pour pré-remplir le formulaire.
 * - Le formulaire lui-même est un Client Component (react-hook-form).
 */
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireSuperAdmin } from '@/lib/auth/permissions'
import { getAppConfig } from '@/lib/config/app-config'

import { OffSeasonForm } from '../../components/OffSeasonForm'

export const metadata = {
  title: 'Nouveau tournoi Hors Saison — Administration',
  robots: { index: false, follow: false },
}

export default async function NewOffSeasonPage() {
  // Garde d'auth — redirige si non SUPER_ADMIN
  await requireSuperAdmin()

  // Pré-charge les valeurs par défaut + le lieu d'événement.
  // Les deux clés sont typées strictement via AppConfig (config.types.ts).
  const [defaults, eventLocation] = await Promise.all([
    getAppConfig('tournament_defaults'),
    getAppConfig('event_location'),
  ])

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
            Nouveau tournoi Hors Saison
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Tournoi unique, sans rattachement à une saison ni impact sur le
            classement annuel.
          </p>
        </div>
      </header>

      {/* ─── Formulaire ─────────────────────────────────────────────── */}
      <OffSeasonForm
        defaults={defaults ?? null}
        eventLocation={eventLocation ?? null}
      />
    </div>
  )
}