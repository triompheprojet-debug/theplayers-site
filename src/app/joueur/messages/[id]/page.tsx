import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ROUTES } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { replyAction } from './actions'
import { ReplyForm } from '../components/ReplyForm'

export const metadata = {
  title: 'Message',
}

interface MessageRow {
  id: string
  subject: string
  body: string
  sent_at: string
  read_at: string | null
  allow_replies: boolean
  recipient_player_id: string | null
}

/**
 * Detail d'un message (mobile-first). Marque le message comme lu en service_role
 * (pas de policy UPDATE joueur, RLS ne filtre pas les colonnes). Affiche le fil
 * des reponses du joueur et le formulaire de reponse si autorise.
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
  if (!user) return null

  const { data: message } = await supabase
    .from('messages')
    .select(
      'id, subject, body, sent_at, read_at, allow_replies, recipient_player_id',
    )
    .eq('id', id)
    .maybeSingle<MessageRow>()

  // Le message doit exister ET avoir ete adresse a ce joueur.
  if (!message || message.recipient_player_id !== user.id) {
    notFound()
  }

  // Marquage « lu » (idempotent) en service_role.
  if (message.read_at === null) {
    const admin = createServiceRoleClient()
    await admin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', message.id)
      .is('read_at', null)
  }

  // Fil : reponses du joueur a ce message.
  const { data: replies } = await supabase
    .from('messages')
    .select('id, body, sent_at')
    .eq('parent_message_id', message.id)
    .eq('sender_player_id', user.id)
    .order('sent_at', { ascending: true })

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={ROUTES.player.messages}
        className="inline-flex items-center gap-1 text-sm text-text-secondary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour
      </Link>

      <article className="flex flex-col gap-3 rounded-xl bg-surface-1 p-5">
        <h1 className="text-xl font-bold text-text-primary">
          {message.subject}
        </h1>
        <p className="text-xs text-text-secondary">
          {new Date(message.sent_at).toLocaleString('fr-FR')}
        </p>
        <p className="whitespace-pre-wrap text-sm text-text-primary">
          {message.body}
        </p>
      </article>

      {replies && replies.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-secondary">
            Tes reponses
          </h2>
          <ul className="flex flex-col gap-2">
            {replies.map((reply) => (
              <li
                key={reply.id}
                className="rounded-xl border border-border bg-surface-2 p-4"
              >
                <p className="whitespace-pre-wrap text-sm text-text-primary">
                  {reply.body}
                </p>
                <p className="mt-2 text-[11px] text-text-secondary">
                  {new Date(reply.sent_at).toLocaleString('fr-FR')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {message.allow_replies ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-secondary">
            Repondre
          </h2>
          <ReplyForm parentMessageId={message.id} action={replyAction} />
        </section>
      ) : (
        <p className="rounded-lg bg-surface-1 p-4 text-center text-xs text-text-secondary">
          Les reponses ne sont pas autorisees pour ce message.
        </p>
      )}
    </div>
  )
}