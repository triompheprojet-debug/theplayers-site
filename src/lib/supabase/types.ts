/**
 * Re-exports des types Supabase pour imports propres.
 *
 * Permet d'importer depuis @/lib/supabase/types au lieu de
 * mélanger @/types/database.types et @supabase/supabase-js.
 */
export type { Database, Json } from '@/types/database.types'
export type { SupabaseClient, User, Session } from '@supabase/supabase-js'

/**
 * Client Supabase typé avec notre Database.
 * Alias pratique pour les signatures de fonctions.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type TypedSupabaseClient = SupabaseClient<Database>