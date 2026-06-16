/**
 * Route d'accueil d'un compte admin selon son rôle.
 *
 * - `referee` (arbitre) : espace dédié /arbitre (saisie de score).
 * - `admin` / `super_admin` : back-office /admin/dashboard.
 *
 * Fonction PURE et SANS `server-only` : utilisée à la fois par le middleware
 * (Edge Runtime), les gardes `permissions.ts` (server) et la Server Action de
 * login. Centralise le routage par rôle pour éviter les `/admin/dashboard`
 * en dur (source de boucle de redirection pour un arbitre pur).
 */
import { ROUTES } from '@/config/routes'

import type { Database } from '@/types/database.types'

type AdminRole = Database['public']['Enums']['admin_role']

export function adminHomeRoute(role: AdminRole): string {
  return role === 'referee' ? ROUTES.referee.scoreEntry : ROUTES.admin.dashboard
}