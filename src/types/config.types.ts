/**
 * Types stricts de la table `app_config`.
 *
 * Chaque clé seedée en M00/M02/M03 a un type précis associé.
 * Toute nouvelle clé doit être ajoutée :
 *   1. dans `AppConfigKey` (union de chaînes)
 *   2. dans `AppConfig` (mapping clé → type de valeur)
 *
 * Pourquoi un typage strict plutôt que `Record<string, unknown>` ?
 *  - Auto-complétion IDE sur `getAppConfig('...')`
 *  - Détection des typos à la compilation
 *  - Sécurité du refactoring (renommer une clé → erreurs partout)
 *
 * Cohérence DB :
 *  - Toutes les clés ici existent dans la migration 02_create_app_config.sql
 *  - L'ordre suit le seed pour faciliter la maintenance
 *  - Les clés `is_secret = true` (qr_*) sont incluses mais retournent null
 *    si l'appelant n'est pas service_role (voir fonction SQL get_app_config)
 */

// ===========================================================================
// 1. Types des valeurs structurées
// ===========================================================================

/**
 * Liens vers les réseaux sociaux du projet.
 */
export interface SocialLinks {
  facebook: string
  instagram: string
  tiktok: string
  whatsapp_public: string
}

/**
 * Un numéro de contact affiché sur la page Contact.
 */
export interface ContactPhone {
  label: string
  number: string // E.164, ex: +24206XXXXXXX
  is_whatsapp: boolean
}

/**
 * Lieu de l'événement (réutilisé par défaut pour tous les tournois).
 */
export interface EventLocation {
  address: string
  maps_url: string
  city: string
  country: string
}

/**
 * Sous-objet d'une difficulté de jeu.
 */
export interface TournamentDefaultsGame {
  name: string
  platform: string
  difficulty: string
}

export interface TournamentDefaultsMatch {
  duration_minutes: number
  half_minutes: number
  break_minutes: number
}

export interface TournamentDefaultsRules {
  late_minutes: number
  claim_minutes: number
  ban_tournaments: number
}

export interface TournamentDefaultsRegistration {
  amount_fcfa: number
}

export interface TournamentDefaultsPrizes {
  first_fcfa: number
  second_fcfa: number
}

export interface TournamentDefaultsConsoles {
  active_count: number
}

export interface TournamentDefaultsSchedule {
  saturday_arrival: string
  saturday_briefing: string
  sunday_arrival: string
  ceremony_time: string
}

export interface TournamentDefaultsPayment {
  mtn_number: string
  mtn_holder_name: string
  airtel_number: string
  airtel_holder_name: string
}

/**
 * Defaults pour les formulaires de création de tournoi (M03.E).
 * Structure miroir de `tournaments.config` (sauf `location` qui réutilise
 * la clé `event_location`).
 */
export interface TournamentDefaults {
  game: TournamentDefaultsGame
  match: TournamentDefaultsMatch
  rules: TournamentDefaultsRules
  registration: TournamentDefaultsRegistration
  prizes: TournamentDefaultsPrizes
  consoles: TournamentDefaultsConsoles
  schedule: TournamentDefaultsSchedule
  payment: TournamentDefaultsPayment
}

/**
 * Templates de messages réutilisables admin (M10).
 * Structure souple : clé = identifiant template, valeur = corps.
 */
export type MessageTemplates = Record<string, { subject: string, body: string }>

// ===========================================================================
// 2. Mapping clé → type de valeur
// ===========================================================================

/**
 * Toutes les clés de la table `app_config` connues à ce stade du projet.
 *
 * Ordre suit le seed 02_create_app_config.sql (+ extension M03).
 *
 * Pour ajouter une clé :
 *  1. INSERT dans la migration 02
 *  2. Ajouter ici (clé + type de valeur)
 */
export interface AppConfig {
  // ─── M00 — Clés de configuration globales ─────────────────────────
  active_tournament_id: string | null
  site_message: string
  social_links: SocialLinks
  contact_phones: ContactPhone[]
  event_location: EventLocation

  // ─── M00 — Sécurité auth admin (lues côté serveur) ────────────────
  pin_max_attempts: number
  pin_lockout_minutes: number

  // ─── M00 — Notifications & messagerie ─────────────────────────────
  notification_retention_days: number
  message_templates: MessageTemplates

  // ─── M00 — Clés secrètes (is_secret = true en DB) ─────────────────
  // Retournent toujours null si l'appelant n'est pas service_role.
  // Présentes pour le typage côté Server Actions admin.
  qr_encryption_key: string
  qr_signing_key: string

  // ─── M03 — Defaults pour formulaires de tournoi ──────────────────
  tournament_defaults: TournamentDefaults
}

/**
 * Union des clés autorisées. Calculée depuis `AppConfig` pour rester
 * automatiquement à jour quand on ajoute une clé.
 */
export type AppConfigKey = keyof AppConfig