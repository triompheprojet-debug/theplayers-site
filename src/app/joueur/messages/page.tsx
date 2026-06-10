import { Mail } from 'lucide-react'
import { redirect } from 'next/navigation'

import { EmptyState } from '@/components/shared/EmptyState'
import { ROUTES } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'

import { MessageItem, type MessageItemData } from './components/MessageItem'

export const metadata = {
  title: 'Messages — THE PLAYERS',
}

/**
 * Liste des messages reçus par le joueur (mobile-first), groupés par jour.
 * Lecture via le client SSR (RLS `recipient_player_id = auth.uid()`).
 */
export default async function PlayerMessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const { data, error } = await supabase
    .from('messages')
    .select('id, subject, body, sent_at, read_at')
    .eq('recipient_player_id', user.id)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) console.error('[PlayerMessagesPage]', error.message)

  const rows = data ?? []

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          icon={Mail}
          title="Aucun message"
          description="Tu retrouveras ici les messages de l'organisation : convocations, rappels et annonces."
        />
      </div>
    )
  }

  // Regroupement par jour (ordre desc conservé)
  const now = new Date()
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const startYesterday = startToday - 86_400_000

  const sectionLabel = (iso: string) => {
    const t = new Date(iso).getTime()
    if (t >= startToday) return "Aujourd'hui"
    if (t >= startYesterday) return 'Hier'
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const groups: { label: string; items: MessageItemData[] }[] = []
  for (const m of rows) {
    const iso = m.sent_at as string
    const label = sectionLabel(iso)
    const item: MessageItemData = {
      id: m.id,
      subject: m.subject ?? 'Message',
      snippet: m.body ?? '',
      timeLabel: timeLabel(iso),
      unread: m.read_at === null,
    }
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-accent-violet">Messages</h1>
      </header>

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.label} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              {group.label}
            </h2>
            <ul className="space-y-3">
              {group.items.map((message) => (
                <li key={message.id}>
                  <MessageItem message={message} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}