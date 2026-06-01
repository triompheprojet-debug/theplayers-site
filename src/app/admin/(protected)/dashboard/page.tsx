import Link from 'next/link'
import { BarChart3, CreditCard, PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { requireAdmin } from '@/lib/auth/permissions'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'
import { listSelectableTournaments } from '@/lib/tournaments/list-selectable'

import { ActiveContextSelector } from './components/ActiveContextSelector'
import { PlaceholderSection } from './components/PlaceholderSection'
import { RegistrationsToggle } from './components/RegistrationsToggle'

export const metadata = {
  title: 'Tableau de bord — Admin',
  robots: { index: false, follow: false },
}

/**
 * Dashboard admin minimal (M04).
 *
 * Le shell (ligne rouge admin + sidebar + topbar) est fourni par
 * (protected)/layout.tsx — cette page ne rend que le contenu.
 *
 * - Tournoi actif + commutation (réutilise M03.C)
 * - Toggle inscriptions du tournoi actif
 * - Sections "À venir" (paiements, statistiques)
 * - Cas vides : aucune édition / aucun tournoi actif
 */
export default async function AdminDashboardPage() {
  const session = await requireAdmin()

  const [active, tournaments] = await Promise.all([
    getActiveTournamentForAdmin(),
    listSelectableTournaments(),
  ])

  const hasEditions = tournaments.length > 0

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-col gap-1">
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

      {!hasEditions ? (
        <section className="rounded-xl bg-surface-1 p-8 text-center">
          <h2 className="text-lg font-semibold text-text-primary">
            Aucune édition pour le moment
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Créez votre première édition pour pouvoir la définir comme tournoi
            actif et gérer les inscriptions.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/admin/editions/hors-saison/nouvelle">
                <PlusCircle className="size-4" aria-hidden />
                <span className="ml-2">Créer votre première édition</span>
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <>
          <ActiveContextSelector active={active} tournaments={tournaments} />

          {active ? (
            <RegistrationsToggle
              tournamentId={active.id}
              initialIsOpen={active.is_registrations_open}
            />
          ) : (
            <section className="rounded-xl bg-surface-1 p-6">
              <p className="text-xs uppercase tracking-wider text-text-secondary">
                Inscriptions
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Sélectionnez un tournoi actif pour gérer l&apos;ouverture des
                inscriptions.
              </p>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <PlaceholderSection
              title="Paiements en attente"
              description="La vérification des preuves de paiement arrivera dans un prochain module."
              icon={CreditCard}
            />
            <PlaceholderSection
              title="Statistiques"
              description="Les indicateurs du tournoi (inscrits, revenus, capacité) arriveront plus tard."
              icon={BarChart3}
            />
          </div>
        </>
      )}
    </div>
  )
}