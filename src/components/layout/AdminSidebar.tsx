'use client'

/**
 * Sidebar admin desktop-first (refonte présentationnelle).
 * Structure pilotée par @/config/navigation (ADMIN_NAV), highlight via usePathname,
 * filtrage `superAdminOnly` selon le rôle. Déconnexion = POST /admin/logout (M02).
 * Accent actif = rouge admin (barre flux à gauche + fond + texte).
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
  LogOut,
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

// Résolution string → composant Lucide (clés utilisées dans ADMIN_NAV)
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

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  referee: 'Arbitre',
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
        'bg-surface-1 pt-0.5',
      )}
    >
      {/* ─── Pavé de marque ──────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={ROUTES.admin.dashboard}
            aria-label="Tableau de bord"
            className="min-w-0"
          >
            <BrandLogo variant="default" />
          </Link>
          <span
            className={cn(
              'shrink-0 rounded-md bg-admin px-2 py-0.5',
              'text-[10px] font-bold uppercase tracking-wider text-white',
              'shadow-[0_0_12px_rgba(220,38,38,0.45)]',
            )}
          >
            Admin
          </span>
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-widest font-semibold text-text-muted">
          Admin Panel
        </p>
      </div>

      {/* ─── Navigation scrollable ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Navigation admin">
        {ADMIN_NAV.map((section) => (
          <SidebarSection
            key={section.label}
            section={section}
            currentPath={pathname}
            role={role}
          />
        ))}
      </nav>

      {/* ─── Profil sticky bottom (séparation par ton de surface) ────── */}
      <div className="mt-auto bg-surface-2/40 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-text-secondary">
              <Shield className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
                {username}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">
                {ROLE_LABEL[role]}
              </p>
            </div>
          </div>

          {/* Déconnexion → POST /admin/logout (Route Handler M02). */}
          <form action="/admin/logout" method="get">
            <button
              type="submit"
              aria-label="Déconnexion"
              title="Déconnexion"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-md',
                'text-text-secondary transition-colors',
                'hover:bg-surface-3 hover:text-admin',
              )}
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}

// ===========================================================================
// Section
// ===========================================================================
interface SidebarSectionProps {
  section: AdminNavSection
  currentPath: string
  role: AdminRole
}

function SidebarSection({ section, currentPath, role }: SidebarSectionProps) {
  const visibleItems = section.items.filter(
    (item) => !item.superAdminOnly || role === 'super_admin',
  )

  if (visibleItems.length === 0) return null

  return (
    <div className="mb-5">
      <h3 className="px-4 mb-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
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
// Lien individuel — actif = barre flux rouge + fond + texte admin
// ===========================================================================
interface SidebarLinkProps {
  item: NavItem
  currentPath: string
}

function SidebarLink({ item, currentPath }: SidebarLinkProps) {
  const Icon = item.icon ? ICON_MAP[item.icon] : null

  const isActive =
    currentPath === item.href || currentPath.startsWith(`${item.href}/`)

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 px-4 py-2.5',
        'text-sm font-medium transition-colors',
        isActive
          ? "text-admin bg-admin/10 before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-r-full before:bg-admin before:shadow-[0_0_10px_rgba(220,38,38,0.6)] before:content-['']"
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
      <span className="truncate">{item.label}</span>
    </Link>
  )
}