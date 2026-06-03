import 'server-only'

import { pseudoToEmail } from '@/lib/auth/pseudo-to-email'
import { logActivity } from '@/lib/activity/log'
import { confirmRegistration } from '@/lib/registrations/confirm'
import { sanitizeDisplayName } from '@/lib/security/sanitize'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getActiveTournamentForAdmin } from '@/lib/tournaments/active'

/**
 * Inscription manuelle sur place par l'admin (M10).
 *
 * Deux modes :
 *  - `existing` : le joueur a déjà un compte → on l'inscrit par son `playerId`.
 *  - `new`      : joueur sans compte → on crée le compte auth (service_role,
 *                 trigger `handle_new_user` crée le profil) puis on l'inscrit.
 *                 Un mot de passe temporaire est généré et renvoyé UNE fois à
 *                 l'admin pour communication au joueur.
 *
 * Statut final : `confirmed` (Option A — espèces payées sur place). On crée
 * l'inscription en `reserved` PUIS on la confirme par UPDATE pour déclencher
 * le trigger d'attribution de badge (`trg_registrations_assign_badge` est
 * AFTER UPDATE : un INSERT direct en `confirmed` ne poserait pas de badge).
 *
 * Une ligne `payments` (méthode `cash`, statut `confirmed`) est ajoutée pour
 * la traçabilité des revenus, si un montant d'inscription est configuré.
 * `registered_via='manual'`, `registered_by_admin=<adminId>`.
 */
export type ManualRegistrationInput =
  | { mode: 'existing'; playerId: string }
  | {
      mode: 'new'
      pseudo: string
      firstName: string
      lastName: string
      phone: string
    }

export type ManualRegistrationResult =
  | {
      ok: true
      registrationId: string
      badgeNumber: number | null
      /** Présent uniquement en mode `new`. À communiquer au joueur. */
      tempPassword?: string
    }
  | {
      ok: false
      reason:
        | 'no_active_tournament'
        | 'tournament_full'
        | 'pseudo_taken'
        | 'player_not_found'
        | 'already_registered'
        | 'account_error'
        | 'db_error'
    }

export async function createManualRegistration(
  input: ManualRegistrationInput,
  adminId: string,
): Promise<ManualRegistrationResult> {
  const tournament = await getActiveTournamentForAdmin()
  if (!tournament) return { ok: false, reason: 'no_active_tournament' }

  const supabase = createServiceRoleClient()

  // 1. Résolution du joueur (existant ou création walk-in)
  let playerId: string
  let tempPassword: string | undefined

  if (input.mode === 'existing') {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', input.playerId)
      .eq('is_deleted', false)
      .maybeSingle()
    if (error) {
      console.error('[manual:existing]', error.message)
      return { ok: false, reason: 'db_error' }
    }
    if (!profile) return { ok: false, reason: 'player_not_found' }
    playerId = profile.id
  } else {
    // Pré-check pseudo libre (message propre ; l'unicité réelle est en DB)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('pseudo', input.pseudo)
      .maybeSingle()
    if (existing) return { ok: false, reason: 'pseudo_taken' }

    tempPassword = generateTempPassword()
    const { data: created, error: authError } =
      await supabase.auth.admin.createUser({
        email: pseudoToEmail(input.pseudo),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          pseudo: input.pseudo,
          phone: input.phone,
          first_name: sanitizeDisplayName(input.firstName),
          last_name: sanitizeDisplayName(input.lastName),
        },
      })

    if (authError || !created?.user) {
      if (authError && /already|exists|registered/i.test(authError.message)) {
        return { ok: false, reason: 'pseudo_taken' }
      }
      console.error('[manual:createUser]', authError?.message)
      return { ok: false, reason: 'account_error' }
    }
    playerId = created.user.id
    // Le profil est créé par le trigger handle_new_user.
  }

  // 2. Garde de capacité — sans jamais exposer le chiffre (Règle 1)
  if (tournament.capacity != null) {
    const { count, error: countError } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)
      .in('status', ['reserved', 'awaiting_verification', 'confirmed'])

    if (countError) {
      console.error('[manual:capacity]', countError.message)
      return { ok: false, reason: 'db_error' }
    }
    if (count != null && count >= tournament.capacity) {
      return { ok: false, reason: 'tournament_full' }
    }
  }

  // 3. Inscription en `reserved` (badge NULL)
  const { data: registration, error: insertError } = await supabase
    .from('registrations')
    .insert({
      tournament_id: tournament.id,
      player_id: playerId,
      status: 'reserved',
      registered_via: 'manual',
      registered_by_admin: adminId,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, reason: 'already_registered' }
    }
    console.error('[manual:insert]', insertError.message)
    return { ok: false, reason: 'db_error' }
  }

  // 4. Confirmation par UPDATE → trigger attribue le badge
  const confirmed = await confirmRegistration(registration.id, supabase)
  if (!confirmed.ok) {
    console.error('[manual:confirm]', confirmed.reason)
    return { ok: false, reason: 'db_error' }
  }

  // 5. Traçabilité revenus : paiement espèces confirmé (si montant configuré)
  const amountFcfa = readRegistrationFee(tournament.config)
  if (amountFcfa != null) {
    const { error: payError } = await supabase.from('payments').insert({
      registration_id: registration.id,
      tournament_id: tournament.id,
      player_id: playerId,
      method: 'cash',
      amount_fcfa: amountFcfa,
      status: 'confirmed',
      verified_at: new Date().toISOString(),
      verified_by: adminId,
      internal_note: 'Inscription manuelle sur place (espèces).',
    })
    if (payError) {
      // Non bloquant : l'inscription est confirmée. On journalise l'écart.
      console.error('[manual:payment]', payError.message)
    }
  }

  await logActivity({
    adminId,
    actionType: 'manual_registration',
    targetTable: 'registrations',
    targetId: registration.id,
    description: `Inscription manuelle (badge ${confirmed.badgeNumber ?? '—'}).`,
    metadata: {
      player_id: playerId,
      mode: input.mode,
      badge_number: confirmed.badgeNumber,
      amount_fcfa: amountFcfa,
    },
  })

  return {
    ok: true,
    registrationId: registration.id,
    badgeNumber: confirmed.badgeNumber,
    tempPassword,
  }
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/** Lit `config.registration.amount_fcfa` de façon défensive (jsonb non typé). */
function readRegistrationFee(config: unknown): number | null {
  if (config && typeof config === 'object' && 'registration' in config) {
    const registration = (config as { registration?: unknown }).registration
    if (registration && typeof registration === 'object') {
      const amount = (registration as { amount_fcfa?: unknown }).amount_fcfa
      if (typeof amount === 'number' && amount > 0) return amount
    }
  }
  return null
}

/**
 * Mot de passe temporaire robuste (compatible règles de complexité usuelles :
 * majuscule + minuscule + chiffre + symbole, longueur ≥ 14).
 */
function generateTempPassword(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const base = Buffer.from(bytes).toString('base64url').slice(0, 12)
  return `Tp1!${base}`
}