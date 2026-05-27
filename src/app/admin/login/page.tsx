import { redirect } from 'next/navigation'

import { AdminRedLine } from '@/components/layout/AdminRedLine'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { getAdminSession } from '@/lib/auth/session'

import { AdminLoginForm } from './components/AdminLoginForm'

export const metadata = {
  title: 'Connexion administrateur',
  robots: { index: false, follow: false },
}

/**
 * Page de connexion admin.
 *
 * - Non linkée publiquement (URL communiquée hors-bande)
 * - Si déjà connecté → redirect vers le dashboard
 * - Sinon : formulaire (Username + PinPad)
 */
export default async function AdminLoginPage() {
  const existingSession = await getAdminSession()
  if (existingSession) {
    redirect('/admin/dashboard')
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-surface-1 px-4 py-12">
      <AdminRedLine />

      <div className="flex w-full max-w-sm flex-col items-center gap-10">
        <BrandLogo />

        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Espace administrateur
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </main>
  )
}