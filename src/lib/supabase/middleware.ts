/**
 * Helper de session pour le middleware Next.js.
 *
 * Sa raison d'être : le pattern officiel @supabase/ssr nécessite que
 * le middleware refresh les tokens d'authentification à chaque requête,
 * sinon les sessions expirent silencieusement.
 *
 * Appelé depuis src/middleware.ts (M06).
 *
 * ⚠️ Authentification ADMIN : ce projet utilise une auth CUSTOM
 * (PIN + JWT cookie, voir M02), PAS Supabase Auth pour les admins.
 * Ce helper sert uniquement aux JOUEURS (M06+) qui utilisent Supabase Auth.
 *
 * Retourne la réponse (avec cookies rafraîchis) ET l'utilisateur courant,
 * pour permettre au middleware de protéger /joueur/* sans second appel réseau.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

import type { Database } from '@/types/database.types'

export interface SupabaseSessionResult {
  supabaseResponse: NextResponse
  user: User | null
}

export async function updateSupabaseSession(
  request: NextRequest,
): Promise<SupabaseSessionResult> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mise à jour des cookies de requête (pour les Route Handlers downstream)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Reconstruction de la réponse avec les nouveaux cookies
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // ⚠️ NE PAS retirer cet appel : refresh la session si nécessaire.
  // getUser() (et non getSession()) valide le token côté serveur.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}