import { Mail } from 'lucide-react'
import Link from 'next/link'

import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

export interface MessageItemData {
  id: string
  subject: string
  snippet: string
  timeLabel: string
  unread: boolean
}

/**
 * Élément de liste d'un message reçu (mobile-first). Avatar = icône Lucide
 * cohérente (pas de photo). Point violet + heure violette quand non lu.
 */
export function MessageItem({ message }: { message: MessageItemData }) {
  return (
    <Link
      href={ROUTES.player.messageDetail(message.id)}
      className="flex items-center gap-3 rounded-2xl bg-surface-1 p-4 transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
    >
      <span
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          message.unread
            ? 'bg-accent-violet shadow-[0_0_8px_rgba(139,92,246,0.7)]'
            : 'bg-transparent',
        )}
        aria-hidden="true"
      />

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent-violet">
        <Mail className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-text-primary',
              message.unread ? 'font-bold' : 'font-medium',
            )}
          >
            {message.unread ? <span className="sr-only">Non lu. </span> : null}
            {message.subject}
          </p>
          <span
            className={cn(
              'shrink-0 font-mono text-xs',
              message.unread ? 'text-accent-violet' : 'text-text-secondary',
            )}
          >
            {message.timeLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-text-secondary">
          {message.snippet}
        </p>
      </div>
    </Link>
  )
}