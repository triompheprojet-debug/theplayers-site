import type { ReactNode } from 'react'

import { PublicFooter } from '@/components/layout/PublicFooter'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { getAppConfig } from '@/lib/config/app-config'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

/**
 * Layout public (M05) — Route Group (public).
 *
 * - Header sticky (CTA inscription gaté par is_registrations_open)
 * - Footer avec réseaux sociaux issus de app_config (zéro hardcode, Règle 11)
 * - Lecture du tournoi actif via la RPC PUBLIQUE uniquement
 *   (getActiveTournamentPublic) : capacity + payment JAMAIS exposés.
 *
 * getAppConfig('social_links') retourne SocialLinks | undefined → coalescé
 * en null pour le footer.
 */
export default async function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  const [active, socialLinks] = await Promise.all([
    getActiveTournamentPublic(),
    getAppConfig('social_links'),
  ])

  const registrationsOpen = active?.is_registrations_open ?? false

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader registrationsOpen={registrationsOpen} />
      <main className="flex-1">{children}</main>
      <PublicFooter socialLinks={socialLinks ?? null} />
    </div>
  )
}