import Link from 'next/link'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { ROUTES } from '@/config/routes'

/**
 * Layout des pages d'authentification joueur (M06).
 *
 * Mobile-first (375px). Centre le contenu, fond surface-1, sans bordure
 * (règle No-Line). Le logo ramène à l'accueil public.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-center px-4 py-6">
        <Link href={ROUTES.home} aria-label="Retour à l'accueil">
          <BrandLogo />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}