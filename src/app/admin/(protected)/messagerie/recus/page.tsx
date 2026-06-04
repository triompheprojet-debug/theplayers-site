import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { FaWhatsapp } from 'react-icons/fa6'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { requireAdminRole } from '@/lib/auth/permissions'
import { buildWhatsAppLink } from '@/lib/messaging/whatsapp-link'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const metadata = {
  title: 'Reponses recues — Admin',
  robots: { index: false, follow: false },
}

interface ReplyRow {
  id: string
  body: string
  sent_at: string
  sender: { pseudo: string; phone: string | null } | null
  parent: { subject: string } | null
}

/**
 * Boite de reception admin (M12) : reponses des joueurs (sender_type='player').
 * Lien WhatsApp genere depuis le telephone du joueur (jamais expose ailleurs).
 */
export default async function AdminReceivedMessagesPage() {
  await requireAdminRole(['super_admin', 'admin'])

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('messages')
    .select(
      `id, body, sent_at,
       sender:profiles!messages_sender_player_id_fkey ( pseudo, phone ),
       parent:messages!messages_parent_message_id_fkey ( subject )`,
    )
    .eq('sender_type', 'player')
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[AdminReceivedMessagesPage]', error.message)
  }

  const replies = (data ?? []) as unknown as ReplyRow[]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 lg:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Messagerie
          </p>
          <h1 className="text-2xl font-bold text-text-primary">
            Reponses recues
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.admin.messaging.root}>Composer</Link>
        </Button>
      </header>

      {replies.length === 0 ? (
        <section className="rounded-xl bg-surface-1 p-8 text-center">
          <MessageSquare
            className="mx-auto size-8 text-text-secondary"
            aria-hidden
          />
          <h2 className="mt-3 text-lg font-semibold text-text-primary">
            Aucune reponse pour le moment
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            Les reponses des joueurs aux messages que tu autorises apparaitront
            ici.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {replies.map((reply) => {
            const phone = reply.sender?.phone ?? null
            const waLink = phone
              ? buildWhatsAppLink(
                  phone,
                  `Bonjour ${reply.sender?.pseudo ?? ''}`.trim(),
                )
              : null

            return (
              <li
                key={reply.id}
                className="rounded-xl bg-surface-1 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {reply.sender ? (
                      <PlayerPseudo pseudo={reply.sender.pseudo} size="xs" />
                    ) : (
                      <span className="text-sm text-text-secondary">
                        Joueur inconnu
                      </span>
                    )}
                    {reply.parent ? (
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        En reponse a : {reply.parent.subject}
                      </p>
                    ) : null}
                  </div>
                  {waLink ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <FaWhatsapp className="size-4" aria-hidden />
                        <span className="ml-2">WhatsApp</span>
                      </a>
                    </Button>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-text-primary">
                  {reply.body}
                </p>
                <p className="mt-2 text-xs text-text-secondary">
                  {new Date(reply.sent_at).toLocaleString('fr-FR')}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}