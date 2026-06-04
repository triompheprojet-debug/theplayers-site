import { Inbox } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdminRole } from '@/lib/auth/permissions'
import { getMessageTemplates } from '@/lib/messaging/templates'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { ComposeMessageForm } from './components/ComposeMessageForm'
import type { RecipientOption } from './components/RecipientSelector'

import type { Database } from '@/types/database.types'

type RegistrationStatus = Database['public']['Enums']['registration_status']

export const metadata = {
  title: 'Messagerie — Admin',
  robots: { index: false, follow: false },
}

const ACTIVE_STATUSES: RegistrationStatus[] = [
  'reserved',
  'awaiting_verification',
  'confirmed',
]

/**
 * Page de composition (M12). Reservee super_admin + admin.
 * Destinataires = joueurs du tournoi actif (pseudo + id uniquement).
 * Templates depuis app_config (Regle 11).
 */
export default async function AdminMessagingPage() {
  await requireAdminRole(['super_admin', 'admin'])

  const active = await getActiveTournamentForAdmin()
  const [recipients, templates] = await Promise.all([
    active ? loadRecipients(active.id) : Promise.resolve<RecipientOption[]>([]),
    getMessageTemplates(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Messagerie
          </p>
          <h1 className="text-2xl font-bold text-text-primary">
            Composer un message
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.admin.messaging.received}>
            <Inbox className="size-4" aria-hidden />
            <span className="ml-2">Reponses recues</span>
          </Link>
        </Button>
      </header>

      <ComposeMessageForm
        recipients={recipients}
        templates={templates}
        hasActiveTournament={active !== null}
      />
    </div>
  )
}

async function loadRecipients(tournamentId: string): Promise<RecipientOption[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('player_id, profiles!registrations_player_id_fkey ( pseudo )')
    .eq('tournament_id', tournamentId)
    .in('status', ACTIVE_STATUSES)

  if (error) {
    console.error('[AdminMessagingPage:recipients]', error.message)
    return []
  }

  // Dedup par joueur + tri par pseudo.
  const seen = new Map<string, string>()
  for (const row of data ?? []) {
    const pseudo = (row.profiles as { pseudo: string } | null)?.pseudo
    if (row.player_id && pseudo && !seen.has(row.player_id)) {
      seen.set(row.player_id, pseudo)
    }
  }

  return Array.from(seen.entries())
    .map(([id, pseudo]) => ({ id, pseudo }))
    .sort((a, b) => a.pseudo.localeCompare(b.pseudo))
}