'use server'

import { headers } from 'next/headers'

import { hasPermission } from '@/lib/auth/permissions'
import { getAdminSession } from '@/lib/auth/session'
import { verifyQrScan, type ScanResult } from '@/lib/qr/verify'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

import type { Database } from '@/types/database.types'

type AdminRole = Database['public']['Enums']['admin_role']

const SCAN_ROLES: readonly AdminRole[] = ['super_admin', 'admin', 'referee']

/**
 * Alternative Server Action a la route `POST /api/qr/verify` (meme logique,
 * reutilise `verifyQrScan` — aucune duplication de la crypto). Le composant
 * `QrScanner` utilise la route ; cette action est fournie pour les appels
 * cote serveur / usages futurs. Leve une erreur sur acces refuse ou absence de
 * tournoi actif (cas verrouilles en amont par la page).
 */
export async function verifyScanAction(payload: string): Promise<ScanResult> {
  const session = await getAdminSession()
  if (!session || !hasPermission(session.role, SCAN_ROLES)) {
    throw new Error('unauthorized')
  }

  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) {
    throw new Error('no_active_tournament')
  }

  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    undefined

  return verifyQrScan(payload, tournament.id, session.adminId, ip)
}