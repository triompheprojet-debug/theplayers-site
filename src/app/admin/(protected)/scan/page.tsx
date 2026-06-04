import { QrCode } from 'lucide-react'

import { requireAdminRole } from '@/lib/auth/permissions'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { QrScanner } from './components/QrScanner'

export const metadata = {
  title: 'Scan des badges — Admin',
  robots: { index: false, follow: false },
}

/**
 * Page de scan jour J. Accessible super_admin / admin / arbitre.
 * Le scan n'a de sens que sur le tournoi ACTIF (etancheite, Regle 12) :
 * sans tournoi actif, on n'affiche pas la camera.
 */
export default async function AdminScanPage() {
  await requireAdminRole(['super_admin', 'admin', 'referee'])
  const active = await getActiveTournamentForAdmin()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Jour J
        </p>
        <h1 className="text-2xl font-bold text-text-primary">
          Scan des badges
        </h1>
      </header>

      {active ? (
        <QrScanner />
      ) : (
        <section className="rounded-xl bg-surface-1 p-8 text-center">
          <QrCode className="mx-auto size-8 text-text-secondary" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold text-text-primary">
            Aucun tournoi actif
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Definis un tournoi actif pour pouvoir scanner les badges a l entree.
          </p>
        </section>
      )}
    </div>
  )
}