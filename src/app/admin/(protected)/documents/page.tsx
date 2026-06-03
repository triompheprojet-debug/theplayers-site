import { redirect } from 'next/navigation'

import { hasPermission } from '@/lib/auth/permissions'
import { getAdminSession } from '@/lib/auth/session'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import { DocumentsTable } from './components/DocumentsTable'

export const metadata = {
  title: 'Documents officiels — Admin — THE PLAYERS',
}

export default async function AdminDocumentsPage() {
  // 1. Auth + permission (re-vérification au-delà du middleware)
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  if (!hasPermission(session.role, ['super_admin', 'admin', 'referee'])) {
    redirect('/admin/dashboard')
  }

  // 2. Tournoi actif (étanchéité Règle 12)
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) {
    return (
      <div className="p-6">
        <div className="bg-surface-1 rounded-lg p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Aucun tournoi actif</h2>
          <p className="text-text-secondary">
            {'Sélectionnez un tournoi pour gérer ses documents.'}
          </p>
        </div>
      </div>
    )
  }

  // 3. Documents existants du tournoi actif
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('documents')
    .select(
      `id, doc_type, is_valid, generated_at, registration_id,
       registrations!documents_registration_id_fkey ( badge_number ),
       profiles!documents_player_id_fkey ( pseudo )`,
    )
    .eq('tournament_id', tournament.id)
    .eq('doc_type', 'receipt_badge')
    .order('generated_at', { ascending: false })

  if (error) console.error('[AdminDocumentsPage]', error.message)

  const rows = (data ?? []).map((d) => {
    const reg = d.registrations as unknown as {
      badge_number: number | null
    } | null
    const prof = d.profiles as unknown as { pseudo: string } | null
    return {
      id: d.id,
      registrationId: d.registration_id,
      badgeNumber: reg?.badge_number ?? null,
      pseudo: prof?.pseudo ?? '—',
      isValid: d.is_valid,
      generatedAt: d.generated_at,
    }
  })

  const canRegenerateAll = hasPermission(session.role, ['super_admin'])

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-text-primary text-2xl font-bold">
          Documents officiels
        </h1>
        <p className="text-text-secondary mt-1">
          {'Reçus et badges (PDF + QR) du tournoi actif.'}
        </p>
      </header>

      <DocumentsTable rows={rows} canRegenerateAll={canRegenerateAll} />
    </div>
  )
}