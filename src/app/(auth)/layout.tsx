import Image from 'next/image'
import Link from 'next/link'

import { ROUTES } from '@/config/routes'

import { BackButton } from './components/BackButton'

/**
 * Layout des pages d'authentification joueur (M06).
 *
 * Fond premium plein écran (fixe) + dégradé vers le fond. Logo de marque fondu
 * via `mix-blend-screen` (le noir du PNG disparaît) + halo violet. Bouton
 * « Retour » en haut-gauche. Mobile-first, No-Line.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Fond fixe + dégradé vers le fond */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <Image
          src="/images/identite_site/background-premiun.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Retour (haut-gauche) */}
      <div className="absolute left-4 top-4 z-10">
        <BackButton />
      </div>

      {/* Logo de marque (fondu dans le fond) */}
      <header className="flex items-center justify-center px-4 pb-8 pt-12">
        <Link
          href={ROUTES.home}
          aria-label="Accueil"
          className="relative flex items-center justify-center"
        >
          <span
            className="absolute h-44 w-44 rounded-full bg-accent-violet/25 blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/images/identite_site/logo.png"
            alt="THE PLAYERS — Liga Esport FC"
            width={256}
            height={256}
            priority
            className="relative h-36 w-36 object-contain mix-blend-screen"
          />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}