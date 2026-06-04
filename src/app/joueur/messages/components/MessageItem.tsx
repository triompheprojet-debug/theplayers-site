import { ChevronRight, MessageCircleReply } from 'lucide-react'
import Link from 'next/link'

import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

export interface MessageItemData {
  id: string
  subject: string
  snippet: string
  sentAt: string
  unread: boolean
  allowReplies: boolean
}

/**
 * Element de liste d'un message recu (espace joueur, mobile-first).
 * Zone tactile pleine largeur, pastille « non lu », indice de reponse possible.
 */
export function MessageItem({ message }: { message: MessageItemData }) {
  return (
    <Link
      href={ROUTES.player.messageDetail(message.id)}
      className="flex items-center gap-3 rounded-xl bg-surface-1 p-4 transition-transform active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {message.unread ? (
            <span
              className="size-2 shrink-0 rounded-full bg-accent-violet"
              aria-label="Non lu"
            />
          ) : null}
          <p
            className={cn(
              'truncate text-sm',
              message.unread
                ? 'font-semibold text-text-primary'
                : 'text-text-primary',
            )}
          >
            {message.subject}
          </p>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
          {message.snippet}
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-text-secondary">
          <span>{new Date(message.sentAt).toLocaleDateString('fr-FR')}</span>
          {message.allowReplies ? (
            <span className="inline-flex items-center gap-1">
              <MessageCircleReply className="size-3" aria-hidden />
              Reponse possible
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-text-secondary"
        aria-hidden
      />
    </Link>
  )
}