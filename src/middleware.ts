import { type NextRequest, NextResponse } from 'next/server'

import { updateSupabaseSession } from '@/lib/supabase/middleware'
import { ROUTES } from '@/config/routes'

/**
 * Middleware racine.
 *
 * - Rafraîchit la session Supabase Auth à chaque requête (cookies) — requis par
 *   @supabase/ssr pour les joueurs.
 * - Protège l'espace joueur : /joueur/* exige une session Supabase valide,
 *   sinon redirection vers /connexion (avec ?next pour revenir après login).
 *
 * NB : les routes /admin/* utilisent l'auth custom (M02) et sont protégées au
 * niveau du layout (requireAdmin), pas ici.
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSupabaseSession(request)

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/joueur')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = ROUTES.signIn
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
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