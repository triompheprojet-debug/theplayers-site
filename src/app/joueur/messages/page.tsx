import { MessageSquare } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

import { MessageItem, type MessageItemData } from './components/MessageItem'

export const metadata = {
  title: 'Messages',
}

/**
 * Liste des messages recus par le joueur (mobile-first).
 * Lecture via le client SSR (RLS `recipient_player_id = auth.uid()`).
 */
export default async function PlayerMessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('messages')
    .select('id, subject, body, sent_at, read_at, allow_replies')
    .eq('recipient_player_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[PlayerMessagesPage]', error.message)
  }

  const messages: MessageItemData[] = (data ?? []).map((m) => ({
    id: m.id,
    subject: m.subject,
    snippet: m.body,
    sentAt: m.sent_at,
    unread: m.read_at === null,
    allowReplies: m.allow_replies,
  }))

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
      </header>

      {messages.length === 0 ? (
        <section className="rounded-xl bg-surface-1 p-8 text-center">
          <MessageSquare
            className="mx-auto size-8 text-text-secondary"
            aria-hidden
          />
          <h2 className="mt-3 text-base font-semibold text-text-primary">
            Aucun message
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-text-secondary">
            Tu retrouveras ici les messages de l{'\u2019'}organisation.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => (
            <li key={message.id}>
              <MessageItem message={message} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}