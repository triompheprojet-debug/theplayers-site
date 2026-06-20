import { redirect } from 'next/navigation'

import { ROUTES } from '@/config/routes'
import { requireSuperAdmin } from '@/lib/auth/permissions'

/**
 * Vue d'ensemble de la configuration. Pour l'instant, redirige vers la
 * première section disponible (Réseaux & coordonnées). Une vraie page de
 * synthèse sera construite quand les sections Comptes et Templates existeront
 * (étapes suivantes de M20).
 */
export default async function ConfigurationPage() {
  await requireSuperAdmin()
  redirect(ROUTES.admin.configuration.social)
}