import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/routes'

/**
 * Déconnexion joueur (M06).
 *
 * Termine la session Supabase Auth puis redirige vers l'accueil.
 * - POST : usage normal (bouton de déconnexion, protégé CSRF same-site).
 * - GET  : tolérance pour une navigation directe vers /deconnexion.
 *
 * N'affecte PAS la session admin (auth custom, cookie distinct).
 */
async function handleSignOut(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // 303 : force un GET sur la cible après un POST.
  return NextResponse.redirect(new URL(ROUTES.home, request.url), {
    status: 303,
  })
}

export async function POST(request: Request) {
  return handleSignOut(request)
}

export async function GET(request: Request) {
  return handleSignOut(request)
}