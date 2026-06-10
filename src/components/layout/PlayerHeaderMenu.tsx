'use client'

import {
  BarChart3,
  CircleUserRound,
  LogOut,
  Network,
  User,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

interface MenuLink {
  href: string
  icon: LucideIcon
  label: string
}

const LINKS: MenuLink[] = [
  { href: ROUTES.player.profile, icon: User, label: 'Mon profil' },
  { href: ROUTES.player.ranking, icon: BarChart3, label: 'Mon classement' },
  { href: ROUTES.player.bracket, icon: Network, label: 'Mon bracket' },
]

/**
 * Menu de l'avatar (top-bar joueur).
 *
 * Rendu en portail sur `document.body` : la top-bar a un `backdrop-blur`
 * qui piégerait un overlay `fixed` enfant (cf. REFONTE_ETAT).
 * Avatar = icône Lucide unique (pas de photo). Déconnexion = POST /deconnexion.
 */
export function PlayerHeaderMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu joueur"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-accent-violet',
          'transition-transform active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
        )}
      >
        <CircleUserRound className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[60]">
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="absolute inset-0 h-full w-full cursor-default"
              />

              <div
                role="menu"
                aria-label="Menu joueur"
                className="absolute right-4 top-20 w-60 overflow-hidden rounded-2xl bg-surface-2 p-2 shadow-2xl"
              >
                {LINKS.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-text-primary',
                      'transition-colors hover:bg-surface-3',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
                    )}
                  >
                    <Icon
                      className="h-5 w-5 text-text-secondary"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span className="text-base">{label}</span>
                  </Link>
                ))}

                <div className="my-1 h-px bg-surface-3" aria-hidden="true" />

                <form action={ROUTES.signOut} method="post">
                  <button
                    type="submit"
                    role="menuitem"
                    className={cn(
                      'flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-danger',
                      'transition-colors hover:bg-danger/10',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
                    )}
                  >
                    <LogOut className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                    <span className="text-base font-medium">Déconnexion</span>
                  </button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}