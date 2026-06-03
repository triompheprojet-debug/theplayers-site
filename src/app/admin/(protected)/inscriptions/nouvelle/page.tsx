import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdmin } from '@/lib/auth/permissions'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { ManualRegistrationForm } from '../components/ManualRegistrationForm'

export const metadata = {
  title: 'Inscription manuelle — Admin',
  robots: { index: false, follow: false },
}

/**
 * Inscription manuelle sur place (M10).
 * Disponible uniquement si un tournoi est actif (l'inscription le cible).
 */
export default async function NewManualRegistrationPage() {
  await requireAdmin()

  const tournament = await getActiveTournamentForAdmin()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={ROUTES.admin.registrations.root}>
            <ChevronLeft aria-hidden />
            Retour aux inscriptions
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Inscription manuelle
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Inscrivez un joueur présent sur place. Paiement en espèces : le
            joueur est confirmé immédiatement et reçoit un badge.
          </p>
        </div>
      </header>

      {tournament ? (
        <ManualRegistrationForm />
      ) : (
        <EmptyState
          title="Aucun tournoi actif"
          description="Définissez un tournoi actif avant d’inscrire un joueur."
        />
      )}
    </div>
  )
}