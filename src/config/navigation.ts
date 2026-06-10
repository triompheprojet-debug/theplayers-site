/**
 * Structure des menus de navigation pour les 4 espaces du site.
 *
 * Les `href` utilisent les constantes de @/config/routes pour éviter
 * la duplication de chaînes URL.
 *
 * Les icônes sont importées depuis lucide-react au point de consommation
 * (header, sidebar, bottom-nav) — on ne les met pas ici pour rester
 * indépendant de React et pouvoir générer un sitemap.
 */
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  href: string
  /** Nom de l'icône Lucide à utiliser (résolu côté composant) */
  icon?: string
  /** Affiche le badge si > 0 (compteur, ex : notifs non lues) */
  badgeKey?: string
  /** Si true, requiert le rôle SUPER_ADMIN (cachée pour ADMIN simple) */
  superAdminOnly?: boolean
}

// ---------------------------------------------------------------------------
// Espace public — header desktop / bottom-nav mobile
// ---------------------------------------------------------------------------
export const PUBLIC_NAV: readonly NavItem[] = [
  { label: 'Accueil', href: ROUTES.home, icon: 'Home' },
  { label: 'Tournoi', href: ROUTES.tournament, icon: 'Trophy' },
  { label: 'Bracket', href: ROUTES.bracket, icon: 'GitBranch' },
  { label: 'Classement', href: ROUTES.ranking, icon: 'BarChart3' },
  { label: 'Historique', href: ROUTES.history, icon: 'History' },
  { label: 'Contact', href: ROUTES.contact, icon: 'Phone' },
] as const

// ---------------------------------------------------------------------------
// Espace joueur — bottom nav mobile fixe
// ---------------------------------------------------------------------------
export const PLAYER_BOTTOM_NAV: readonly NavItem[] = [
  { label: 'Accueil', href: ROUTES.player.dashboard, icon: 'Home' },
  { label: 'Bracket', href: ROUTES.player.bracket, icon: 'GitBranch' },
  { label: 'Classement', href: ROUTES.player.ranking, icon: 'BarChart3' },
  { label: 'Documents', href: ROUTES.player.documents, icon: 'FileText' },
  {
    label: 'Messages',
    href: ROUTES.player.messages,
    icon: 'MessageSquare',
    badgeKey: 'unreadMessages',
  },
] as const

// ---------------------------------------------------------------------------
// Espace arbitre — top nav mobile
// ---------------------------------------------------------------------------
export const REFEREE_NAV: readonly NavItem[] = [
  { label: 'Dashboard', href: ROUTES.referee.dashboard, icon: 'LayoutDashboard' },
  { label: 'Matchs', href: ROUTES.referee.matches, icon: 'Swords' },
  { label: 'Saisie', href: ROUTES.referee.scoreEntry, icon: 'PenSquare' },
  { label: 'Bracket', href: ROUTES.referee.bracket, icon: 'GitBranch' },
] as const

// ---------------------------------------------------------------------------
// Espace admin — sidebar desktop (avec sous-menus)
// ---------------------------------------------------------------------------
export interface AdminNavSection {
  label: string
  items: NavItem[]
  superAdminOnly?: boolean
}

export const ADMIN_NAV: readonly AdminNavSection[] = [
  {
    label: 'Tableau de bord',
    items: [
      { label: 'Dashboard', href: ROUTES.admin.dashboard, icon: 'LayoutDashboard' },
      { label: 'Tournoi actif', href: ROUTES.admin.tournament, icon: 'Trophy' },
    ],
  },
  {
    label: 'Éditions',
    items: [
      { label: 'Toutes les éditions', href: ROUTES.admin.editions.root, icon: 'List' },
    ],
  },
  {
    label: 'Inscriptions & paiements',
    items: [
      { label: 'Inscriptions', href: ROUTES.admin.registrations.root, icon: 'Users', badgeKey: 'pendingRegistrations' },
      { label: 'Paiements', href: ROUTES.admin.payments, icon: 'CreditCard', badgeKey: 'pendingPayments' },
      { label: 'Numéros (badges)', href: ROUTES.admin.badgeNumbers, icon: 'Hash' },
    ],
  },
  {
    label: 'Jour J',
    items: [
      { label: 'Scan QR', href: ROUTES.admin.scan, icon: 'QrCode' },
      { label: 'Documents', href: ROUTES.admin.documents, icon: 'FileText' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Messagerie', href: ROUTES.admin.messaging.root, icon: 'Mail' },
      { label: 'Messages reçus', href: ROUTES.admin.messaging.received, icon: 'Inbox' },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { label: 'Statistiques', href: ROUTES.admin.statistics, icon: 'BarChart' },
    ],
  },
  {
    label: 'Configuration',
    superAdminOnly: false, // section accessible
    items: [
      { label: 'Vue d\'ensemble', href: ROUTES.admin.configuration.root, icon: 'Settings' },
      { label: 'Comptes admin', href: ROUTES.admin.configuration.accounts, icon: 'UserCog', superAdminOnly: true },
      { label: 'Réseaux sociaux', href: ROUTES.admin.configuration.social, icon: 'Share2', superAdminOnly: true },
      { label: 'Templates messages', href: ROUTES.admin.configuration.templates, icon: 'FileCode', superAdminOnly: true },
      { label: 'QR & sécurité', href: ROUTES.admin.configuration.qr, icon: 'Shield', superAdminOnly: true },
    ],
  },
] as const