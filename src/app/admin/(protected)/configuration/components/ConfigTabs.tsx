'use client'

import { FileCode, KeyRound, Share2, UserCog } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

import type { LucideIcon } from 'lucide-react'

interface ConfigTab {
  label: string
  href: string
  icon: LucideIcon
  enabled: boolean
  badge?: string
}

const TABS: ConfigTab[] = [
  {
    label: 'Comptes',
    href: ROUTES.admin.configuration.accounts,
    icon: UserCog,
    enabled: false,
  },
  {
    label: 'Clés QR',
    href: ROUTES.admin.configuration.qr,
    icon: KeyRound,
    enabled: true,
    badge: 'en place',
  },
  {
    label: 'Réseaux & coordonnées',
    href: ROUTES.admin.configuration.social,
    icon: Share2,
    enabled: true,
  },
  {
    label: 'Templates',
    href: ROUTES.admin.configuration.templates,
    icon: FileCode,
    enabled: false,
  },
]

const BASE =
  'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors'

/**
 * Navigation horizontale interne à la section Configuration.
 * Les onglets non encore construits (Comptes, Templates) sont désactivés
 * jusqu'à leur étape pour éviter tout lien mort.
 */
export function ConfigTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Sections de configuration">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = pathname === tab.href

        const content = (
          <>
            <Icon className="size-4" aria-hidden />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="rounded-full bg-success-neon/15 px-2 py-0.5 text-[10px] font-semibold text-success-neon">
                {tab.badge}
              </span>
            )}
          </>
        )

        if (!tab.enabled) {
          return (
            <span
              key={tab.href}
              aria-disabled
              title="Bientôt disponible"
              className={cn(BASE, 'cursor-not-allowed text-text-muted/60')}
            >
              {content}
            </span>
          )
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              BASE,
              active
                ? 'bg-surface-1 text-text-primary shadow-[inset_0_-2px_0_var(--color-admin)]'
                : 'text-text-secondary hover:bg-surface-1 hover:text-text-primary',
            )}
          >
            {content}
          </Link>
        )
      })}
    </nav>
  )
}