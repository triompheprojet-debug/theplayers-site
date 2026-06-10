'use client'

import {
  Banknote,
  FileText,
  Home,
  MessageSquare,
  User,
  type LucideIcon,
} from 'lucide-react'
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
  { href: ROUTES.player.dashboard, icon: Home, label: 'Accueil' },
  { href: ROUTES.player.documents, icon: FileText, label: 'Documents' },
  { href: ROUTES.player.payment, icon: Banknote, label: 'Paiement' },
  { href: ROUTES.player.messages, icon: MessageSquare, label: 'Messages' },
  { href: ROUTES.player.profile, icon: User, label: 'Profil' },
]

/**
 * Navigation principale de l'espace joueur (mobile-first).
 *
 * - Fixe en bas, atteignable au pouce (single-thumb).
 * - Glassmorphism réservé à la navigation (design system).
 * - Onglet « Accueil » actif uniquement sur le chemin exact (`/joueur`),
 *   les autres en correspondance de préfixe (sous-pages incluses).
 * - Zones tactiles ≥ 48px (conteneur h-16). Aucun emoji (icônes Lucide).
 */
export function PlayerBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation joueur"
      className="fixed inset-x-0 bottom-0 z-50 bg-surface-1/80 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === ROUTES.player.dashboard
              ? pathname === href
              : pathname.startsWith(href)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1.5 px-1',
                  'transition-transform active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-violet',
                  isActive
                    ? 'text-accent-violet'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-1 w-8 rounded-full bg-accent-violet shadow-[0_0_8px_2px_rgba(139,92,246,0.6)]"
                  />
                ) : null}

                <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />

                <span
                  className={cn(
                    'text-[10px] uppercase leading-none tracking-wide',
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