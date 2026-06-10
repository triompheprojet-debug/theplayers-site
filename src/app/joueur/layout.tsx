import { redirect } from 'next/navigation'

import { NotificationBell } from '@/components/layout/NotificationBell'
import { PlayerBottomNav } from '@/components/layout/PlayerBottomNav'
import { PlayerHeaderMenu } from '@/components/layout/PlayerHeaderMenu'
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'
import { createClient } from '@/lib/supabase/server'

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Garde d'auth au niveau layout (en plus du middleware /joueur/*)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('pseudo')
    .eq('id', user.id)
    .single()

  return (
    <RealtimeProvider>
      <div className="flex min-h-screen flex-col bg-background text-text-primary">
        {/* Top-bar mobile : salutation (pseudo) + cloche + menu avatar */}
        <header className="sticky top-0 z-40 flex items-center justify-between bg-surface-1/80 px-4 py-3 backdrop-blur-md">
          <p className="text-base text-text-secondary">
            Salut,{' '}
            {profile?.pseudo ? (
              <span className="font-bold text-text-primary">
                {profile.pseudo}
              </span>
            ) : null}
          </p>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <PlayerHeaderMenu />
          </div>
        </header>

        <main className="flex-1 pb-20">{children}</main>

        <PlayerBottomNav />
      </div>
    </RealtimeProvider>
  )
}