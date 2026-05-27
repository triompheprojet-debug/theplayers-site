'use client'

/**
 * Sidebar admin desktop-first (M03.B).
 *
 * - Largeur fixe 264px, fixed left-0.
 * - Structure pilotée par @/config/navigation (ADMIN_NAV).
 * - Highlight de la route active via usePathname.
 * - Filtrage des items `superAdminOnly` selon le rôle reçu en prop.
 * - Profil admin sticky en bas (username + badge rôle + bouton déconnexion).
 *
 * La déconnexion pointe vers la Route Handler existante /admin/logout
 * (créée en M02). Méthode POST par convention (mutation d'état).
 * Si la Route Handler M02 répond uniquement à GET, retirer `method="post"`.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart,
  BarChart3,
  CreditCard,
  FileCode,
  FileText,
  Hash,
  Inbox,
  LayoutDashboard,
  List,
  type LucideIcon,
  Mail,
  QrCode,
  Settings,
  Share2,
  Shield,
  Trophy,
  UserCog,
  Users,
} from 'lucide-react'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { ADMIN_NAV, type AdminNavSection, type NavItem } from '@/config/navigation'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

import type { Database } from '@/types/database.types'

type AdminRole = Database['public']['Enums']['admin_role']

interface AdminSidebarProps {
  username: string
  role: AdminRole
}

// ---------------------------------------------------------------------------
// Résolution string → composant Lucide (icônes utilisées dans ADMIN_NAV)
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Trophy,
  List,
  Users,
  CreditCard,
  Hash,
  QrCode,
  FileText,
  Mail,
  Inbox,
  BarChart,
  BarChart3,
  Settings,
  UserCog,
  Share2,
  FileCode,
  Shield,
}

// ---------------------------------------------------------------------------
// Étiquettes des rôles (en français, badge)
// ---------------------------------------------------------------------------
const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  referee: 'Arbitre',
}

const ROLE_CLASSES: Record<AdminRole, string> = {
  super_admin: 'bg-accent-violet/20 text-accent-violet',
  admin: 'bg-surface-2 text-text-secondary',
  referee: 'bg-surface-2 text-text-secondary',
}

// ===========================================================================
// Composant principal
// ===========================================================================
export function AdminSidebar({ username, role }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 w-66',
        'flex flex-col',
        'bg-surface-1 border-r border-border',
        'pt-0.5', 
      )}
    >
      {/* ─── Logo / en-tête ──────────────────────────────────────────── */}
      <div className="flex items-center px-6 py-5 border-b border-border">
        <Link href={ROUTES.admin.dashboard} aria-label="Tableau de bord">
          <BrandLogo variant="default" withText />
        </Link>
      </div>

      {/* ─── Navigation scrollable ───────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Navigation admin"
      >
        {ADMIN_NAV.map((section) => (
          <SidebarSection
            key={section.label}
            section={section}
            currentPath={pathname}
            role={role}
          />
        ))}
      </nav>

      {/* ─── Profil sticky bottom ────────────────────────────────────── */}
      <div className="border-t border-border px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-text-primary truncate">
            {username}
          </p>
          <span
            className={cn(
              'inline-block mt-1 px-2 py-0.5 rounded-full',
              'text-[10px] uppercase tracking-wider font-semibold',
              ROLE_CLASSES[role],
            )}
          >
            {ROLE_LABEL[role]}
          </span>
        </div>

        {/*
          Déconnexion → POST sur /admin/logout (Route Handler M02).
          Si M02 utilise GET, remplacer par : <Link href="/admin/logout">…</Link>
        */}
        <form action="/admin/logout" method="post">
          <button
            type="submit"
            className={cn(
              'w-full px-3 py-2 rounded-md',
              'text-sm font-medium text-text-secondary',
              'hover:bg-surface-2 hover:text-text-primary transition-colors',
              'border border-border',
            )}
          >
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  )
}

// ===========================================================================
// Section de la sidebar
// ===========================================================================
interface SidebarSectionProps {
  section: AdminNavSection
  currentPath: string
  role: AdminRole
}

function SidebarSection({ section, currentPath, role }: SidebarSectionProps) {
  // Filtrer les items selon le rôle
  const visibleItems = section.items.filter(
    (item) => !item.superAdminOnly || role === 'super_admin',
  )

  // Si la section devient vide après filtrage, on la masque
  if (visibleItems.length === 0) return null

  return (
    <div className="mb-5">
      <h3
        className={cn(
          'px-3 mb-1.5',
          'text-[10px] uppercase tracking-wider font-semibold',
          'text-text-secondary',
        )}
      >
        {section.label}
      </h3>
      <ul className="space-y-0.5">
        {visibleItems.map((item) => (
          <li key={item.href}>
            <SidebarLink item={item} currentPath={currentPath} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ===========================================================================
// Lien individuel
// ===========================================================================
interface SidebarLinkProps {
  item: NavItem
  currentPath: string
}

function SidebarLink({ item, currentPath }: SidebarLinkProps) {
  const Icon = item.icon ? ICON_MAP[item.icon] : null

  // Active si exact match ou si le path courant commence par item.href + '/'
  const isActive =
    currentPath === item.href || currentPath.startsWith(`${item.href}/`)

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md',
        'text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent-violet/15 text-accent-violet'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
      <span className="truncate">{item.label}</span>
    </Link>
  )
}