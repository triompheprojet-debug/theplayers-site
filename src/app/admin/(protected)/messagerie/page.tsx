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
import { SentMessagesList, type SentMessage } from './components/SentMessagesList'

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
 * Section historique (P3) : messages envoyes par cet admin, modifiables/supprimables.
 */
export default async function AdminMessagingPage() {
  const session = await requireAdminRole(['super_admin', 'admin'])

  const active = await getActiveTournamentForAdmin()
  const [recipients, templates, sentMessages] = await Promise.all([
    active ? loadRecipients(active.id) : Promise.resolve<RecipientOption[]>([]),
    getMessageTemplates(),
    loadSentMessages(session.adminId),
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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
          Messages envoyes
        </h2>
        <SentMessagesList messages={sentMessages} />
      </section>
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

async function loadSentMessages(adminId: string): Promise<SentMessage[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('messages')
    .select(
      `id, subject, body, sent_at, read_at, allow_replies, edited_at, broadcast_scope,
       recipient:profiles!messages_recipient_player_id_fkey ( pseudo )`,
    )
    .eq('sender_type', 'admin')
    .eq('sender_admin_id', adminId)
    .eq('is_deleted', false)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[AdminMessagingPage:sent]', error.message)
    return []
  }

  return (data ?? []) as unknown as SentMessage[]
}