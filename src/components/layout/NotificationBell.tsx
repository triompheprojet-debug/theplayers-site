'use client'

import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useNotifications } from '@/components/providers/RealtimeProvider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

/**
 * Cloche de notifications (header joueur, mobile-first).
 * Badge compteur non-lus ; feuille du bas listant les notifications ;
 * un clic marque la notification lue et navigue vers `action_url`.
 */
export function NotificationBell() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} non lues`
              : 'Notifications'
          }
          className="relative flex size-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary active:scale-95"
        >
          <Bell className="size-6" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent-violet px-1 text-[10px] font-bold leading-4 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-violet"
            >
              <CheckCheck className="size-4" aria-hidden />
              Tout marquer lu
            </button>
          ) : null}
        </SheetHeader>

        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-text-secondary">
            Aucune notification pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 px-4 py-4">
            {items.map((n) => {
              const unread = n.read_at === null
              const content = (
                <div
                  className={cn(
                    'rounded-lg border border-border p-3 transition-colors',
                    unread ? 'bg-surface-2' : 'bg-surface-1',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {unread ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-accent-violet"
                        aria-hidden
                      />
                    ) : null}
                    <p
                      className={cn(
                        'truncate text-sm',
                        unread
                          ? 'font-semibold text-text-primary'
                          : 'text-text-primary',
                      )}
                    >
                      {n.title}
                    </p>
                  </div>
                  {n.body ? (
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                      {n.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-text-secondary">
                    {new Date(n.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              )

              return (
                <li key={n.id}>
                  {n.action_url ? (
                    <Link
                      href={n.action_url}
                      onClick={() => {
                        if (unread) void markRead(n.id)
                        setOpen(false)
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => unread && void markRead(n.id)}
                    >
                      {content}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}