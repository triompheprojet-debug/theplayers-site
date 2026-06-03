import 'server-only'

import { createElement } from 'react'
import type { ReactElement } from 'react'

import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'

import { PlayerBadgePdf } from '@/components/pdf/PlayerBadgePdf'
import type { PlayerBadgePdfProps } from '@/components/pdf/PlayerBadgePdf'
import { registerPdfFonts } from '@/components/pdf/pdf-fonts'
import { getAppConfig } from '@/lib/config/app-config'
import { paymentMethodLabel } from '@/lib/payments/methods'
import { generateBadgeQr } from '@/lib/qr/generate'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

import { uploadDocumentPdf } from './upload-to-storage'

const DOC_TYPE = 'receipt_badge'

/**
 * Génération du PDF officiel (reçu + badge) d'une inscription confirmée (M11).
 *
 * Lit l'inscription / tournoi / profil / paiement confirmé en service_role,
 * construit le QR chiffré, rend le PDF en buffer. Aucune capacité (Règle 1).
 * Montant = celui du paiement confirmé (décision M11). Jeu / lieu / contacts =
 * lus dans app_config (zéro hardcode — Règle 11).
 */
export type BuildPdfResult =
  | {
      ok: true
      pdf: Buffer
      playerId: string
      tournamentId: string
      badgeNumber: number
      encryptedPayload: string
      signature: string
    }
  | {
      ok: false
      reason: 'not_found' | 'not_confirmed' | 'no_badge' | 'db_error' | 'render_error'
    }

export async function buildBadgePdf(
  registrationId: string,
): Promise<BuildPdfResult> {
  const supabase = createServiceRoleClient()

  // 1. Inscription
  const { data: reg, error: regErr } = await supabase
    .from('registrations')
    .select('id, status, badge_number, tournament_id, player_id, confirmed_at')
    .eq('id', registrationId)
    .maybeSingle()

  if (regErr) {
    console.error('[buildBadgePdf:reg]', regErr.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!reg) return { ok: false, reason: 'not_found' }
  if (reg.status !== 'confirmed') return { ok: false, reason: 'not_confirmed' }
  if (reg.badge_number == null) return { ok: false, reason: 'no_badge' }

  // 2. Tournoi + profil + paiement confirmé (le plus récent)
  const [{ data: tournament }, { data: profile }, { data: payment }] =
    await Promise.all([
      supabase
        .from('tournaments')
        .select('id, name, config')
        .eq('id', reg.tournament_id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('pseudo')
        .eq('id', reg.player_id)
        .maybeSingle(),
      supabase
        .from('payments')
        .select('amount_fcfa, method, transaction_ref, verified_at')
        .eq('registration_id', registrationId)
        .eq('status', 'confirmed')
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  if (!tournament || !profile) {
    return { ok: false, reason: 'not_found' }
  }

  // 3. Données affichables (zéro hardcode)
  const gameName = await readGameName(tournament.config)
  const venueLabel = await readVenueLabel()
  const contactLabel = await readContactLabel()

  const amountLabel =
    payment?.amount_fcfa != null
      ? `${payment.amount_fcfa.toLocaleString('fr-FR')} FCFA`
      : '-'
  const methodLabel = payment?.method ? paymentMethodLabel(payment.method) : '-'
  const confirmedAtLabel = formatDateFr(
    reg.confirmed_at ?? payment?.verified_at ?? null,
  )

  // 4. QR chiffré + signé
  let qr
  try {
    qr = await generateBadgeQr(reg.player_id, reg.tournament_id, reg.badge_number)
  } catch (err) {
    console.error('[buildBadgePdf:qr]', err)
    return { ok: false, reason: 'render_error' }
  }

  // 5. Rendu PDF (serveur)
  registerPdfFonts()
  const props: PlayerBadgePdfProps = {
    tournamentName: tournament.name,
    gameName,
    pseudo: profile.pseudo,
    badgeNumber: reg.badge_number,
    amountLabel,
    methodLabel,
    transactionRef: payment?.transaction_ref ?? null,
    confirmedAtLabel,
    venueLabel,
    contactLabel,
    qrDataUrl: qr.qrDataUrl,
    documentRef: shortRef(registrationId),
  }

  try {
    // renderToBuffer attend un ReactElement<DocumentProps>. PlayerBadgePdf rend
    // un <Document>, mais TS le type sur PlayerBadgePdfProps → cast contrôlé.
    const element = createElement(
      PlayerBadgePdf,
      props,
    ) as unknown as ReactElement<DocumentProps>
    const pdf = await renderToBuffer(element)
    return {
      ok: true,
      pdf,
      playerId: reg.player_id,
      tournamentId: reg.tournament_id,
      badgeNumber: reg.badge_number,
      encryptedPayload: qr.encryptedPayload,
      signature: qr.signature,
    }
  } catch (err) {
    console.error('[buildBadgePdf:render]', err)
    return { ok: false, reason: 'render_error' }
  }
}

/**
 * Crochet appelé (best-effort) à la confirmation d'un paiement (M10) et par
 * la régénération admin (M11 étape 2). Génère le PDF, l'upload, puis UPSERT la
 * ligne `documents` (une seule ligne par inscription+type). Ne lève jamais :
 * renvoie un résultat que l'appelant peut ignorer sans bloquer la confirmation.
 */
export type GenerateDocumentResult =
  | { ok: true; documentId: string; storagePath: string }
  | { ok: false; reason: string }

export async function generateDocumentForRegistration(
  registrationId: string,
  options?: { generatedByAdminId?: string },
): Promise<GenerateDocumentResult> {
  try {
    const built = await buildBadgePdf(registrationId)
    if (!built.ok) return { ok: false, reason: built.reason }

    const uploaded = await uploadDocumentPdf(
      built.playerId,
      built.tournamentId,
      registrationId,
      built.pdf,
    )
    if (!uploaded.ok) return { ok: false, reason: uploaded.error }

    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('documents')
      .upsert(
        {
          registration_id: registrationId,
          tournament_id: built.tournamentId,
          player_id: built.playerId,
          doc_type: DOC_TYPE,
          storage_path: uploaded.path,
          file_size_bytes: built.pdf.byteLength,
          qr_encrypted_payload: built.encryptedPayload,
          qr_signature: built.signature,
          qr_version: 1,
          is_valid: true,
          generated_at: new Date().toISOString(),
          generated_by: options?.generatedByAdminId ?? null,
        },
        { onConflict: 'registration_id,doc_type' },
      )
      .select('id')
      .single()

    if (error) {
      console.error('[generateDocumentForRegistration:upsert]', error.message)
      return { ok: false, reason: error.message }
    }

    return { ok: true, documentId: data.id, storagePath: uploaded.path }
  } catch (err) {
    console.error('[generateDocumentForRegistration]', err)
    return { ok: false, reason: 'unexpected_error' }
  }
}

// ---------------------------------------------------------------------------
// Helpers (lecture défensive jsonb / app_config — zéro hardcode)
// ---------------------------------------------------------------------------

async function readGameName(config: unknown): Promise<string> {
  const fromConfig = pickGameName(config)
  if (fromConfig) return fromConfig
  // Repli : valeur par défaut globale (app_config.tournament_defaults.game.name)
  const defaults = await getAppConfig('tournament_defaults')
  const fromDefaults = pickGameName(defaults)
  return fromDefaults ?? '-'
}

function pickGameName(source: unknown): string | null {
  if (source && typeof source === 'object' && 'game' in source) {
    const game = (source as { game?: unknown }).game
    if (game && typeof game === 'object' && 'name' in game) {
      const name = (game as { name?: unknown }).name
      if (typeof name === 'string' && name.trim()) return name
    }
  }
  return null
}

async function readVenueLabel(): Promise<string> {
  const loc = (await getAppConfig('event_location')) as unknown as
    | { city?: string; country?: string }
    | null
  const parts = [loc?.city, loc?.country].filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  )
  return parts.length ? parts.join(', ') : '-'
}

async function readContactLabel(): Promise<string | null> {
  const phones = (await getAppConfig('contact_phones')) as unknown as unknown[]
  if (Array.isArray(phones) && phones.length > 0) {
    const list = phones.filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0,
    )
    return list.length ? list.slice(0, 2).join(' / ') : null
  }
  return null
}

function formatDateFr(iso: string | null): string {
  if (!iso) return '-'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Africa/Brazzaville',
    }).format(new Date(iso))
  } catch {
    return '-'
  }
}

function shortRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}