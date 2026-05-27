import { NextResponse } from 'next/server'

import { clearAdminSession } from '@/lib/auth/session'

/**
 * Déconnexion admin.
 *
 * GET → supprime le cookie de session puis redirige vers /admin/login.
 * Idempotent : appelable même sans session active.
 */
export async function GET(request: Request) {
  await clearAdminSession()
  const loginUrl = new URL('/admin/login', request.url)
  return NextResponse.redirect(loginUrl)
}