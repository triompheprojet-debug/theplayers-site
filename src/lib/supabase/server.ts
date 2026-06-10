/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 *
 * Lit/écrit les cookies via next/headers (asynchrone en Next 15+).
 * Le try/catch autour de setAll() est nécessaire : Server Components ne
 * peuvent pas écrire de cookies, mais le middleware s'en chargera ensuite.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Appelé depuis un Server Component (lecture seule).
            // Le middleware (M02+) rafraîchira la session côté requête.
          }
        },
      },
    },
  )
}