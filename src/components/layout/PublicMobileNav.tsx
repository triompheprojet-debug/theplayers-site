'use client'

/**
 * Navigation mobile publique (M05).
 *
 * - Bouton burger (visible < md) qui ouvre un drawer plein écran
 * - Glassmorphism (réservé à la navigation, cf. design system)
 * - Touch targets >= 48px, single-thumb : liens en bas de panneau
 * - Lien actif surligné via usePathname
 * - Aucun emoji (icônes Lucide), No-Line (séparation par tons)
 */
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

interface PublicMobileNavProps {
  links: NavLink[]
  signUpHref: string
  showSignUp: boolean
}

export function PublicMobileNav({
  links,
  signUpHref,
  showSignUp,
}: PublicMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

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

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-lg"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-text-secondary">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="inline-flex size-12 items-center justify-center rounded-md text-text-primary active:scale-95"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-end gap-2 p-4 pb-8">
            <ul className="flex flex-col gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex min-h-12 items-center rounded-md px-4 text-lg font-semibold',
                        isActive
                          ? 'bg-surface-2 text-accent-violet'
                          : 'text-text-primary active:bg-surface-1',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {showSignUp && (
              <Link
                href={signUpHref}
                onClick={() => setOpen(false)}
                className="mt-2 flex min-h-14 items-center justify-center rounded-md bg-accent-violet px-6 font-bold text-text-on-accent active:scale-[0.98]"
              >
                S&apos;inscrire en ligne
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}