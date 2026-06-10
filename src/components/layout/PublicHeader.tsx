/**
 * Header public — Server Component.
 *
 * - Sticky + glassmorphism (réservé à la navigation), lueur ambiante violette.
 * - Brand : icône manette (Lucide) + wordmark BrandLogo (THE violet / PLAYERS blanc).
 * - Nav desktop (>= md) ; drawer mobile délégué à PublicMobileNav (Client).
 * - "Connexion" toujours visible ; "S'inscrire" uniquement si inscriptions ouvertes.
 * - No-Line, aucun emoji.
 */
import { Gamepad2 } from 'lucide-react'
import Link from 'next/link'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { PublicMobileNav } from '@/components/layout/PublicMobileNav'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: ROUTES.home, label: 'Accueil' },
  { href: ROUTES.tournament, label: 'Tournoi' },
  { href: ROUTES.eventTypes, label: "Types d'événements" },
  { href: ROUTES.bracket, label: 'Bracket' },
  { href: ROUTES.ranking, label: 'Classement' },
  { href: ROUTES.history, label: 'Historique' },
  { href: ROUTES.contact, label: 'Contact' },
]

interface PublicHeaderProps {
  registrationsOpen: boolean
}

export function PublicHeader({ registrationsOpen }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/85 shadow-ambient-violet backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href={ROUTES.home}
          aria-label="THE PLAYERS — accueil"
          className="inline-flex items-center gap-2"
        >
          <Gamepad2 className="size-7 text-accent-violet" aria-hidden />
          <BrandLogo variant="small" />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:block" aria-label="Navigation principale">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.filter((l) => l.href !== ROUTES.home).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'flex min-h-12 items-center rounded-md px-3 text-sm font-medium',
                    'text-text-secondary transition-colors hover:bg-surface-1 hover:text-text-primary',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.signIn}
            className="hidden h-12 items-center rounded-md px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-1 hover:text-text-primary md:inline-flex"
          >
            Connexion
          </Link>

          {registrationsOpen && (
            <Link
              href={ROUTES.signUp}
              className="hidden h-12 items-center justify-center rounded-md bg-accent-violet px-5 font-semibold text-text-on-accent transition-colors hover:bg-accent-violet-hover active:scale-[0.98] md:inline-flex"
            >
              {"S'inscrire"}
            </Link>
          )}

          <PublicMobileNav
            links={NAV_LINKS}
            signInHref={ROUTES.signIn}
            signUpHref={ROUTES.signUp}
            showSignUp={registrationsOpen}
          />
        </div>
      </div>
    </header>
  )
}