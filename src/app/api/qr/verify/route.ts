import { NextResponse, type NextRequest } from 'next/server'

import { hasPermission } from '@/lib/auth/permissions'
import { getAdminSession } from '@/lib/auth/session'
import { verifyQrScan } from '@/lib/qr/verify'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import type { Database } from '@/types/database.types'

type AdminRole = Database['public']['Enums']['admin_role']

// Le scan jour J est accessible aux 3 roles admin.
const SCAN_ROLES: readonly AdminRole[] = ['super_admin', 'admin', 'referee']

// Payload sensible dans le body + validation cote serveur : jamais de cache.
export const dynamic = 'force-dynamic'

/**
 * Validation d'un QR scanne (M13). Le client envoie la chaine BRUTE scannee ;
 * tout se decide ICI (serveur) via `verifyQrScan` (M11). Aucune cle cote client.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session || !hasPermission(session.role, SCAN_ROLES)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload = ''
  try {
    const body = (await request.json()) as { payload?: unknown }
    payload = typeof body.payload === 'string' ? body.payload : ''
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  if (payload === '') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) {
    return NextResponse.json({ error: 'no_active_tournament' }, { status: 409 })
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined

  const result = await verifyQrScan(payload, tournament.id, session.adminId, ip)
  return NextResponse.json(result)
}