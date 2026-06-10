'use client'

/**
 * Navigation mobile publique — drawer latéral (slide-in gauche).
 *
 * Rendu via createPortal vers <body> : le header ayant backdrop-blur
 * (bloc conteneur), un enfant `fixed` y serait piégé. Le portail l'évite.
 *
 * - Une icône Lucide par lien, lien actif surligné (barre violette + ton).
 * - Connexion (toujours) + S'inscrire (si inscriptions ouvertes).
 * - >= 48px ; ESC ferme ; scroll body verrouillé à l'ouverture.
 */
import {
  Gamepad2,
  History,
  Home,
  LayoutGrid,
  Mail,
  Medal,
  Menu,
  Network,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

interface PublicMobileNavProps {
  links: NavLink[]
  signInHref: string
  signUpHref: string
  showSignUp: boolean
}

const ICONS: Record<string, LucideIcon> = {
  [ROUTES.home]: Home,
  [ROUTES.tournament]: Trophy,
  [ROUTES.eventTypes]: LayoutGrid,
  [ROUTES.bracket]: Network,
  [ROUTES.ranking]: Medal,
  [ROUTES.history]: History,
  [ROUTES.contact]: Mail,
}

export function PublicMobileNav({
  links,
  signInHref,
  signUpHref,
  showSignUp,
}: PublicMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        className="inline-flex size-12 items-center justify-center rounded-md text-text-primary active:scale-95"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {/* Overlay (clic = fermeture) */}
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            />

            {/* Panneau latéral */}
            <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-surface-1/95 backdrop-blur-xl">
              <div className="flex items-center justify-between px-4 py-4">
                <span className="inline-flex items-center gap-2">
                  <Gamepad2 className="size-6 text-accent-violet" aria-hidden />
                  <BrandLogo variant="small" />
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer le menu"
                  className="inline-flex size-12 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary active:scale-95"
                >
                  <X className="size-6" aria-hidden />
                </button>
              </div>

              <nav
                className="flex-1 overflow-y-auto px-2 py-2"
                aria-label="Navigation principale"
              >
                <ul className="flex flex-col gap-1">
                  {links.map((link) => {
                    const Icon = ICONS[link.href] ?? Home
                    const isActive =
                      link.href === ROUTES.home
                        ? pathname === link.href
                        : pathname.startsWith(link.href)

                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'relative flex min-h-12 items-center gap-3 rounded-md px-4 text-sm font-semibold uppercase tracking-wide',
                            isActive
                              ? 'bg-surface-2 text-accent-violet'
                              : 'text-text-secondary transition-colors hover:text-text-primary active:bg-surface-1',
                          )}
                        >
                          {isActive && (
                            <span
                              aria-hidden
                              className="absolute inset-y-2 left-0 w-1 rounded-r bg-accent-violet"
                            />
                          )}
                          <Icon className="size-5 shrink-0" aria-hidden />
                          {link.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="flex flex-col gap-2 px-4 py-4">
                <Link
                  href={signInHref}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-md bg-surface-2 px-4 font-semibold text-accent-violet transition-colors hover:bg-surface-3 active:scale-[0.98]"
                >
                  Connexion
                </Link>
                {showSignUp && (
                  <Link
                    href={signUpHref}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-md bg-accent-violet px-4 font-bold text-text-on-accent transition-colors hover:bg-accent-violet-hover active:scale-[0.98]"
                  >
                    {"S'inscrire en ligne"}
                  </Link>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  )
}