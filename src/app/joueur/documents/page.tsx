import { AlertTriangle, FileText } from 'lucide-react'
import { redirect } from 'next/navigation'

import { EmptyState } from '@/components/shared/EmptyState'
import { ROUTES } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { DocumentCard } from './components/DocumentCard'

export const metadata = {
  title: 'Mes documents — THE PLAYERS',
}

export default async function PlayerDocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

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

  // Aucun document → état vide centré (icône + message)
  if (docs.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          icon={FileText}
          title="Aucun document pour l'instant"
          description="Tes reçus et badges apparaîtront ici une fois ton paiement confirmé par l'organisation."
        />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-center gap-2 bg-warning/10 px-4 py-3 text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
        <p className="text-center text-xs font-bold uppercase tracking-wider">
          Imprime tes documents avant le jour J
        </p>
      </div>

      <div className="space-y-6 px-4 pt-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-accent-violet">Mes documents</h1>
          <p className="text-sm text-text-secondary">
            {'Reçus et badges de tes inscriptions confirmées.'}
          </p>
        </header>

        <div className="space-y-3">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>

        {/*
          NON codé (noté) : « Bracket » → M14 ; « Règlement officiel » → pas de
          document `rules` (pages légales) ; QR inline → uniquement dans le PDF.
        */}
      </div>
    </div>
  )
}