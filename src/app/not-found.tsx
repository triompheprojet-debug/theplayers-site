import Link from 'next/link'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { ROUTES } from '@/config/routes'

export const metadata = {
  title: 'Page introuvable — THE PLAYERS',
}

/**
 * 404 globale (M05). Restylée selon le design system (No-Line, tokens projet).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-16 text-center">
      <BrandLogo variant="default" withText />
      <p className="text-6xl font-black text-accent-violet">404</p>
      <h1 className="text-2xl font-bold text-text-primary">Page introuvable</h1>
      <p className="max-w-md text-sm text-text-secondary">
        La page que vous recherchez n&apos;existe pas, a été renommée ou est
        temporairement indisponible.
      </p>
      <Link
        href={ROUTES.home}
        className="inline-flex min-h-[48px] items-center rounded-md bg-accent-violet px-6 font-semibold text-text-on-accent active:scale-[0.98]"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  )
}