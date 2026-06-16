'use client'

import { Network, SquarePen, Swords, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
}

const ITEMS: NavItem[] = [
  { href: ROUTES.referee.scoreEntry, icon: SquarePen, label: 'Saisie' },
  { href: ROUTES.referee.matches, icon: Swords, label: 'Matchs' },
  { href: ROUTES.referee.bracket, icon: Network, label: 'Bracket' },
]

/**
 * Navigation principale de l'espace arbitre (mobile-first).
 *
 * - Haute et fixe (sticky), atteignable au pouce.
 * - Accent orange `referee` pour distinguer l'espace (vs violet admin/joueur).
 * - Glassmorphism réservé à la navigation (design system) + ligne orange
 *   sous la barre (DESIGN.md §902).
 * - Onglet « Saisie » actif sur le chemin exact ; les autres en préfixe.
 * - Zones tactiles ≥ 48px (h-14). Aucun emoji (icônes Lucide).
 */
export function RefereeTopNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation arbitre"
      className="sticky top-0 z-40 border-b-2 border-referee bg-surface-1/80 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === ROUTES.referee.scoreEntry
              ? pathname === href
              : pathname.startsWith(href)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-14 flex-col items-center justify-center gap-1 px-1',
                  'transition-transform active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-referee',
                  isActive
                    ? 'text-referee'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 h-1 w-10 rounded-full bg-referee shadow-[0_0_8px_2px_rgba(249,115,22,0.55)]"
                  />
                ) : null}

                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />

                <span
                  className={cn(
                    'text-[11px] uppercase leading-none tracking-wide',
                    isActive ? 'font-bold' : 'font-medium',
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}