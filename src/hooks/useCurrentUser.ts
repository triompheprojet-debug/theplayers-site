'use client'

import { useQuery } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface CurrentUser {
  id: string
  profile: Profile
}

/**
 * Récupère le joueur connecté (user Supabase Auth + sa ligne profiles).
 *
 * - Retourne `null` si non authentifié.
 * - RLS profiles_select_own garantit qu'on ne lit que son propre profil.
 * - À utiliser dans les Client Components de l'espace joueur (M07+).
 *
 * Pour les Server Components, lire directement via createClient() côté serveur
 * (ce hook est réservé au navigateur).
 */
export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error || !profile) return null

      return { id: user.id, profile }
    },
    staleTime: 60_000,
  })
}