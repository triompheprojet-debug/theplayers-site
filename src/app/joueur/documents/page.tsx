import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { DocumentCard } from './components/DocumentCard'

export const metadata = {
  title: 'Mes documents — THE PLAYERS',
}

export default async function PlayerDocumentsPage() {
  // 1. Auth joueur
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Documents valides du joueur (archive personnelle, tous tournois).
  //    Lecture service_role strictement filtrée sur user.id → les jointures
  //    (tournoi, badge) résolvent sans dépendre de la RLS de lecture croisée.
  const admin = createServiceRoleClient()
  const { data, error } = await admin
    .from('documents')
    .select(
      `id, generated_at,
       registrations!documents_registration_id_fkey ( badge_number ),
       tournaments!documents_tournament_id_fkey ( name )`,
    )
    .eq('player_id', user.id)
    .eq('doc_type', 'receipt_badge')
    .eq('is_valid', true)
    .order('generated_at', { ascending: false })

  if (error) console.error('[PlayerDocumentsPage]', error.message)

  const docs = (data ?? []).map((d) => {
    const reg = d.registrations as unknown as {
      badge_number: number | null
    } | null
    const tour = d.tournaments as unknown as { name: string } | null
    return {
      id: d.id,
      badgeNumber: reg?.badge_number ?? null,
      tournamentName: tour?.name ?? 'Tournoi',
      generatedAt: d.generated_at,
    }
  })

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <header className="bg-surface-1 px-4 py-6">
        <h1 className="text-2xl font-bold">Mes documents</h1>
        <p className="text-text-secondary mt-1 text-sm">
          {'Reçus et badges de vos inscriptions confirmées.'}
        </p>
      </header>

      <main className="flex-1 space-y-3 px-4 py-6">
        {docs.length === 0 ? (
          <div className="bg-surface-1 rounded-2xl p-6 text-center">
            <p className="text-text-secondary">
              {
                'Vos reçus et badges apparaîtront ici après confirmation de votre paiement.'
              }
            </p>
          </div>
        ) : (
          docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
        )}
      </main>
    </div>
  )
}