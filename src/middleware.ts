import { type NextRequest, NextResponse } from 'next/server'

import { adminHomeRoute } from '@/lib/auth/home-route'
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
} from '@/lib/auth/session'
import { updateSupabaseSession } from '@/lib/supabase/middleware'
import { ROUTES } from '@/config/routes'

/**
 * Middleware racine — trois espaces, trois mécanismes.
 *
 * - /arbitre/* : auth admin custom (cookie JWT). Accessible aux rôles
 *   super_admin, admin et referee. Pas de session valide → /admin/login.
 *
 * - /admin/*   : même auth custom. Pas de session → /admin/login. Un compte
 *   PUREMENT arbitre (role=referee) n'a rien à faire dans le back-office :
 *   il est renvoyé vers son espace dédié (/arbitre). Les pages publiques
 *   /admin/login et /admin/logout restent hors garde (sinon boucle).
 *
 * - /joueur/*  : Supabase Auth (cookies rafraîchis à chaque requête). Pas de
 *   user → /connexion (avec ?next pour revenir après login).
 *
 * - reste      : public. La session Supabase est rafraîchie pour la cohérence
 *   des cookies joueur.
 *
 * NB : verifyAdminSessionToken est volontairement compatible Edge (jose, pas
 * de cookies() ici) — voir src/lib/auth/session.ts.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ───── Espace arbitre (auth admin custom) ─────────────────────────────
  if (pathname.startsWith('/arbitre')) {
    const session = await readAdminSession(request)
    if (!session) return redirectToAdminLogin(request, pathname)
    // super_admin, admin et referee sont tous autorisés.
    return NextResponse.next()
  }

  // ───── Back-office admin (auth admin custom) ──────────────────────────
  const isAdminPublic =
    pathname === ROUTES.admin.login || pathname.startsWith('/admin/logout')

  if (pathname.startsWith('/admin') && !isAdminPublic) {
    const session = await readAdminSession(request)
    if (!session) return redirectToAdminLogin(request, pathname)

    // Un arbitre pur est redirigé vers son espace dédié.
    if (session.role === 'referee') {
      const url = request.nextUrl.clone()
      url.pathname = adminHomeRoute(session.role)
      url.search = ''
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // ───── Joueur (Supabase Auth) + public ────────────────────────────────
  const { supabaseResponse, user } = await updateSupabaseSession(request)

  if (pathname.startsWith('/joueur') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.signIn
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

/** Lit et vérifie le cookie de session admin (null si absent/invalide/expiré). */
async function readAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifyAdminSessionToken(token)
}

/** Redirige vers la page de connexion admin en conservant la cible (?next). */
function redirectToAdminLogin(request: NextRequest, fromPath: string) {
  const url = request.nextUrl.clone()
  url.pathname = ROUTES.admin.login
  url.searchParams.set('next', fromPath)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.json
     * - public/images, public/icons, public/fonts
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|images/|icons/|fonts/).*)',
  ],
}