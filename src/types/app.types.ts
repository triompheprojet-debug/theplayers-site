/**
 * Types métier transverses — alias pratiques sur Database
 *
 * À enrichir au fur et à mesure que database.types.ts est régénéré.
 * Convention : Row = lecture, Insert = création, Update = mise à jour.
 */
import type { Database } from './database.types'

// ============================================================================
// Helpers génériques
// ============================================================================
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type { ActionResult } from './api.types'

// ============================================================================
// Identifiants typés (alias clairs)
// ============================================================================
export type UUID = string
export type ISODateString = string
export type ISOTimestampString = string


export type AdminRole = Enums<'admin_role'>
export type TournamentType = Enums<'tournament_type'>
export type TournamentStatus = Enums<'tournament_status'>
export type PaymentMethod = Enums<'payment_method'>
export type RegistrationStatus = Enums<'registration_status'>
export type PaymentStatus = Enums<'payment_status'>
export type MatchStatus = Enums<'match_status'>
export type PlayerRank = Enums<'player_rank'>
export type JobStatus = Enums<'job_status'>
export type JobType = Enums<'job_type'>
export type NotificationType = Enums<'notification_type'>