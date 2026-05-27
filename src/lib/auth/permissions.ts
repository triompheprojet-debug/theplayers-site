/**
 * Vérifications de rôle admin et gardes pour pages/Server Actions.
 *
 * Hiérarchie des rôles : super_admin > admin > referee.
 * Mais pas de chaînage automatique — chaque vérif liste explicitement
 * les rôles autorisés pour éviter les escalades implicites.
 */
import 'server-only'

import { redirect } from 'next/navigation'

import { getAdminSession, type AdminSessionPayload } from './session'

import type { Database } from '@/types/database.types'

type AdminRole = Database['public']['Enums']['admin_role']

/**
 * Vérification pure : le rôle est-il dans la liste autorisée ?
 */
export function hasPermission(
  role: AdminRole,
  allowedRoles: readonly AdminRole[],
): boolean {
  return allowedRoles.includes(role)
}

/**
 * Garde générique pour pages admin : exige une session valide.
 * Redirige vers `/admin/login` si non connecté.
 * Renvoie le payload pour usage dans le composant.
 */
export async function requireAdmin(): Promise<AdminSessionPayload> {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}

/**
 * Variante : exige un rôle parmi une liste.
 * Si connecté mais rôle insuffisant → redirect dashboard (accès refusé silencieux).
 */
export async function requireAdminRole(
  allowedRoles: readonly AdminRole[],
): Promise<AdminSessionPayload> {
  const session = await requireAdmin()
  if (!hasPermission(session.role, allowedRoles)) {
    redirect('/admin/dashboard')
  }
  return session
}

/**
 * Garde dédiée SUPER_ADMIN — actions sensibles (créer un admin, modifier app_config).
 */
export async function requireSuperAdmin(): Promise<AdminSessionPayload> {
  return requireAdminRole(['super_admin'])
}