import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ROUTES } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { replyAction } from './actions'
import { ReplyForm } from '../components/ReplyForm'

export const metadata = {
  title: 'Message — THE PLAYERS',
}

interface MessageRow {
  id: string
  subject: string
  body: string
  sent_at: string | null
  read_at: string | null
  allow_replies: boolean
  recipient_player_id: string | null
}

interface ThreadRow {
  id: string
  body: string
  sent_at: string | null
  sender_type: string
}

const REPLY_LIMIT = 2

/**
 * Detail d'un message (mobile-first). Marque le message comme lu en service_role
 * (pas de policy UPDATE joueur). Fil des reponses + formulaire de reponse si
 * autorise ET quota non atteint (2 reponses depuis le dernier message admin).
 */
export default async function PlayerMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const { data: message } = await supabase
    .from('messages')
    .select(
      'id, subject, body, sent_at, read_at, allow_replies, recipient_player_id',
    )
    .eq('id', id)
    .maybeSingle<MessageRow>()

  if (!message || message.recipient_player_id !== user.id) {
    notFound()
  }

  if (message.read_at === null) {
    const admin = createServiceRoleClient()
    await admin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', message.id)
      .is('read_at', null)
  }

  // Fil du message (RLS : ne renvoie que les lignes visibles du joueur).
  const { data: threadData } = await supabase
    .from('messages')
    .select('id, body, sent_at, sender_type')
    .eq('parent_message_id', message.id)
    .order('sent_at', { ascending: true })

  const thread = (threadData ?? []) as ThreadRow[]
  const replies = thread.filter((r) => r.sender_type === 'player')

  // Repere = dernier message admin du fil (relance admin in-thread plus tard),
  // sinon le message racine. Le quota se compte depuis ce repere.
  const lastAdminTs =
    thread
      .filter((r) => r.sender_type === 'admin')
      .reduce<string | null>(
        (max, r) =>
          r.sent_at && (max === null || r.sent_at > max) ? r.sent_at : max,
        null,
      ) ?? message.sent_at

  const repliesUsed = lastAdminTs
    ? replies.filter((r) => r.sent_at && r.sent_at > lastAdminTs).length
    : replies.length
  const repliesRemaining = Math.max(0, REPLY_LIMIT - repliesUsed)

  return (
    <div className="space-y-5 px-4 py-6">
      <Link
        href={ROUTES.player.messages}
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour
      </Link>

      <article className="space-y-3 rounded-2xl bg-surface-1 p-5">
        <h1 className="text-xl font-bold text-text-primary">
          {message.subject}
        </h1>
        {message.sent_at ? (
          <p className="font-mono text-xs text-text-secondary">
            {new Date(message.sent_at).toLocaleString('fr-FR')}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-sm text-text-primary">
          {message.body}
        </p>
      </article>

      {replies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Tes reponses
          </h2>
          <ul className="space-y-2">
            {replies.map((reply) => (
              <li key={reply.id} className="rounded-2xl bg-surface-2 p-4">
                <p className="whitespace-pre-wrap text-sm text-text-primary">
                  {reply.body}
                </p>
                {reply.sent_at ? (
                  <p className="mt-2 font-mono text-[11px] text-text-secondary">
                    {new Date(reply.sent_at).toLocaleString('fr-FR')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {message.allow_replies && repliesRemaining > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Repondre
          </h2>
          <ReplyForm
            parentMessageId={message.id}
            action={replyAction}
            remaining={repliesRemaining}
          />
        </section>
      ) : message.allow_replies ? (
        <p className="rounded-2xl bg-surface-1 p-4 text-center text-xs text-text-secondary">
          {"Tu as utilise tes 2 reponses pour ce message. Attends que l'admin relance la discussion."}
        </p>
      ) : (
        <p className="rounded-2xl bg-surface-1 p-4 text-center text-xs text-text-secondary">
          {'Les reponses ne sont pas autorisees pour ce message.'}
        </p>
      )}
    </div>
  )
}