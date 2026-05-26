import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware racine — version minimale M00.
 *
 * Sera enrichi par :
 *  - M02 : protection des routes /admin/* (vérification session admin + role)
 *  - M06 : refresh de la session Supabase Auth pour les routes /joueur/*
 *
 * Pour l'instant : passe-plat. Aucune route n'est protégée.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes SAUF :
     *  - _next/static (fichiers statiques)
     *  - _next/image (optimisation d'images)
     *  - favicon.ico, robots.txt, sitemap.xml, manifest.json
     *  - public/images, public/icons, public/fonts
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|images/|icons/|fonts/).*)',
  ],
}