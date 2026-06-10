import 'server-only'

import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

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
const ORGANIZER = 'THE PLAYERS'
const DOCUMENT_VERSION = 'v1.0'

/**
 * Génération du PDF officiel (reçu + badge) d'une inscription confirmée (M11).
 *
 * Lit l'inscription / tournoi / saison / profil / paiement / agent validateur
 * en service_role, construit le QR chiffré, et rend le PDF en buffer. Aucune
 * capacité (Règle 1). Montant = paiement confirmé. Jeu / lieu / ville / heure
 * d'accueil = lus dans la config du tournoi (zéro hardcode — Règle 11). Toutes
 * les valeurs sont mises en forme ICI : le composant ne reçoit que des libellés.
 *
 * `documentUid` est dérivé de l'UUID de la ligne `documents` (traçabilité). Le
 * PDF étant rendu AVANT l'upsert, l'appelant pré-résout l'UUID (opts.documentId).
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
  opts?: { documentId?: string },
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
        .select(
          'id, name, config, tournament_type, season_id, tournament_number, start_date',
        )
        .eq('id', reg.tournament_id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('pseudo, first_name, last_name, phone')
        .eq('id', reg.player_id)
        .maybeSingle(),
      supabase
        .from('payments')
        .select(
          'amount_fcfa, method, transaction_ref, status, sender_phone, sender_name, submitted_at, verified_at, verified_by',
        )
        .eq('registration_id', registrationId)
        .eq('status', 'confirmed')
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  if (!tournament || !profile) {
    return { ok: false, reason: 'not_found' }
  }

  // 2b. Saison parente (si tournoi de saison) + agent validateur
  let seasonLabel: string | null = null
  let tournamentInSeasonLabel: string | null = null
  if (tournament.season_id) {
    const { data: season } = await supabase
      .from('seasons')
      .select('name, season_number, start_date, expected_tournaments')
      .eq('id', tournament.season_id)
      .maybeSingle()
    if (season) {
      const year = new Date(`${season.start_date}T12:00:00Z`).getUTCFullYear()
      seasonLabel = `${season.name} — ${year}`
      if (tournament.tournament_number != null) {
        tournamentInSeasonLabel = `N° ${tournament.tournament_number} / ${season.expected_tournaments}`
      }
    }
  }

  let validatorLabel = '—'
  if (payment?.verified_by) {
    const { data: admin } = await supabase
      .from('admin_accounts')
      .select('username, display_name')
      .eq('id', payment.verified_by)
      .maybeSingle()
    if (admin) {
      validatorLabel = `${admin.username.toUpperCase()} · ${admin.display_name}`
    }
  }

  // 3. Données affichables (zéro hardcode — lecture de la config du tournoi)
  const gameName = await readGameName(tournament.config)
  const venueName = pickVenueAddress(tournament.config)
  const cityLabel = await readCityLabel(tournament.config)
  const serviceCity = await readEventCity(tournament.config)
  const contactLabel = await readContactLabel()
  const arrivalTimeLabel = pickArrivalTime(tournament.config)

  const amountValue =
    payment?.amount_fcfa != null ? formatFcfa(payment.amount_fcfa) : '—'
  const methodLabel = payment?.method ? paymentMethodLabel(payment.method) : '—'
  const methodShort = methodShortOf(payment?.method)
  const methodLogoDataUrl = readMethodLogo(methodShort)

  // 4. QR chiffré + signé
  let qr
  try {
    qr = await generateBadgeQr(reg.player_id, reg.tournament_id, reg.badge_number)
  } catch (err) {
    console.error('[buildBadgePdf:qr]', err)
    return { ok: false, reason: 'render_error' }
  }

  // 5. Identifiants présentés
  const documentId = opts?.documentId ?? randomUUID()
  const confirmedIso = reg.confirmed_at ?? payment?.verified_at ?? null
  const now = new Date()

  // 6. Rendu PDF (serveur)
  registerPdfFonts()
  const props: PlayerBadgePdfProps = {
    logoDataUrl: readPublicImageDataUrl(SITE_LOGO_CANDIDATES),
    methodLogoDataUrl,
    qrDataUrl: qr.qrDataUrl,

    receiptNumber: buildReceiptNumber(confirmedIso, reg.badge_number),
    generatedAtLabel: formatGenHeaderFr(now), // « 09 juin 2026 — 14:36 (UTC+1) »
    generationDateLabel: formatGenSlashFr(now), // « 09 / 06 / 2026 — 14:36 »
    serviceCity,
    documentVersion: DOCUMENT_VERSION,
    documentUid: formatDocUid(documentId),

    pseudo: profile.pseudo,
    firstName: profile.first_name?.trim() || '—',
    lastName: profile.last_name?.trim() || '—',
    phone: profile.phone,
    badgeNumber: reg.badge_number,

    tournamentName: tournament.name,
    eventTypeLabel: eventTypeLabel(tournament.tournament_type),
    seasonLabel,
    tournamentInSeasonLabel,
    gameName,
    eventDateLabel: cap(formatEventDate(tournament.start_date, 'long')),
    eventDateShortLabel: buildEventDateShort(tournament.start_date, arrivalTimeLabel),
    arrivalTimeLabel,
    organizer: ORGANIZER,
    venueName,
    cityLabel,

    paymentStatusLabel: paymentStatusLabel(payment?.status),
    methodLabel,
    methodShort,
    amountValue,
    transactionRef: payment?.transaction_ref?.trim() || '—',
    payerPhone: payment?.sender_phone?.trim() || '—',
    payerName: payment?.sender_name?.trim() || '—',
    paymentDateLabel: formatDateTimeFr(payment?.submitted_at ?? null),
    validationDateLabel: formatDateTimeFr(payment?.verified_at ?? null),
    validatorLabel,

    badgeId: buildBadgeId(reg.badge_number, tournament.name, tournament.tournament_number),

    contactLabel,
  }

  try {
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
 * Crochet appelé (best-effort) à la confirmation d'un paiement (M10) et par la
 * régénération admin (M11). Pré-résout l'UUID `documents`, génère le PDF,
 * l'upload, puis UPSERT la ligne (id figé). Ne lève jamais.
 */
export type GenerateDocumentResult =
  | { ok: true; documentId: string; storagePath: string }
  | { ok: false; reason: string }

export async function generateDocumentForRegistration(
  registrationId: string,
  options?: { generatedByAdminId?: string },
): Promise<GenerateDocumentResult> {
  try {
    const supabase = createServiceRoleClient()

    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('registration_id', registrationId)
      .eq('doc_type', DOC_TYPE)
      .maybeSingle()
    const documentId = existing?.id ?? randomUUID()

    const built = await buildBadgePdf(registrationId, { documentId })
    if (!built.ok) return { ok: false, reason: built.reason }

    const uploaded = await uploadDocumentPdf(
      built.playerId,
      built.tournamentId,
      registrationId,
      built.pdf,
    )
    if (!uploaded.ok) return { ok: false, reason: uploaded.error }

    const { data, error } = await supabase
      .from('documents')
      .upsert(
        {
          id: documentId,
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
// Assets locaux (data URL — aucun fetch réseau au rendu)
// ---------------------------------------------------------------------------

const imageCache = new Map<string, string | null>()

/** Essaie plusieurs chemins candidats sous /public et renvoie le premier lisible. */
function readPublicImageDataUrl(relPaths: string | string[]): string | null {
  const list = Array.isArray(relPaths) ? relPaths : [relPaths]
  const cacheKey = list.join('|')
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey) as string | null
  for (const rel of list) {
    try {
      const abs = path.join(process.cwd(), 'public', rel)
      const buf = readFileSync(abs)
      const dataUrl = `data:image/png;base64,${buf.toString('base64')}`
      imageCache.set(cacheKey, dataUrl)
      return dataUrl
    } catch {
      // chemin suivant
    }
  }
  console.error('[readPublicImageDataUrl] introuvable :', list.join(', '))
  imageCache.set(cacheKey, null)
  return null
}

const SITE_LOGO_CANDIDATES = [
  'images/identite_site/logo.png',
  'images/identite_site/site-logo.png',
  'images/site-logo.png',
  'images/logo.png',
]

function readMethodLogo(method: 'mtn' | 'airtel' | 'cash' | null): string | null {
  if (method === 'mtn') {
    return readPublicImageDataUrl([
      'images/operateur_telephonique/logo-mtn.png',
      'images/logo-mtn.png',
    ])
  }
  if (method === 'airtel') {
    return readPublicImageDataUrl([
      'images/operateur_telephonique/logo-airtel.png',
      'images/logo-airtel.png',
    ])
  }
  return null
}

// ---------------------------------------------------------------------------
// Helpers de présentation (formatage)
// ---------------------------------------------------------------------------

function methodShortOf(method?: string | null): 'mtn' | 'airtel' | 'cash' | null {
  if (!method) return null
  const m = method.toLowerCase()
  if (m.includes('mtn')) return 'mtn'
  if (m.includes('airtel')) return 'airtel'
  if (m.includes('cash') || m.includes('esp')) return 'cash'
  return null
}

function eventTypeLabel(t: string): string {
  switch (t) {
    case 'season':
      return 'SAISON'
    case 'off_season':
      return 'HORS SAISON'
    case 'grand_final':
      return 'GRANDE FINALE'
    default:
      return t.toUpperCase()
  }
}

function paymentStatusLabel(status?: string | null): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmé'
    case 'pending':
      return 'En attente'
    case 'rejected':
      return 'Rejeté'
    default:
      return '—'
  }
}

/** Sépare les milliers par une espace simple (évite le glyphe parasite de toLocaleString). */
function formatFcfa(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function cap(s: string): string {
  return s && s !== '—' ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/** « REC-2026-06-0042 » : année + mois de confirmation + n° de badge (4 chiffres). */
function buildReceiptNumber(confirmedIso: string | null, badge: number): string {
  const d = confirmedIso ? new Date(confirmedIso) : new Date()
  const year = new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    timeZone: 'Africa/Brazzaville',
  }).format(d)
  const month = new Intl.DateTimeFormat('fr-FR', {
    month: '2-digit',
    timeZone: 'Africa/Brazzaville',
  }).format(d)
  return `REC-${year}-${month}-${String(badge).padStart(4, '0')}`
}

/** « TP-DOC-7F3A-9C21-44E8-B0D6 » dérivé des 16 premiers hex de l'UUID. */
function formatDocUid(uuid: string): string {
  const hex = uuid.replace(/-/g, '').toUpperCase()
  return `TP-DOC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`
}

/** « BDG-42-TBP » : n° badge + initiales du nom + n° de tournoi (repli : chiffres du nom). */
function buildBadgeId(badge: number, name: string, tournamentNumber: number | null): string {
  const initials = name
    .replace(/[^A-Za-zÀ-ÿ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => /[A-Za-zÀ-ÿ]/.test(w[0] ?? ''))
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('')
  const num =
    tournamentNumber != null ? String(tournamentNumber) : name.match(/\d+/)?.[0] ?? ''
  const code = `${initials}${num}` || 'TP'
  return `BDG-${badge}-${code}`
}

/** Date d'événement (colonne `date`), figée à midi UTC pour éviter tout décalage de jour. */
function formatEventDate(dateOnly: string, kind: 'long' | 'short'): string {
  try {
    const d = new Date(`${dateOnly}T12:00:00Z`)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: kind === 'long' ? 'long' : 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d)
  } catch {
    return '—'
  }
}

function buildEventDateShort(dateOnly: string, arrival: string): string {
  const base = cap(formatEventDate(dateOnly, 'short'))
  if (base === '—') return '—'
  return arrival !== '—' ? `${base} · ${arrival}` : base
}

/** Horodatage paiement/validation : « 09 juin 2026 — 14h32 ». */
function formatDateTimeFr(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const datePart = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Brazzaville',
    }).format(d)
    const hm = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Brazzaville',
    }).format(d)
    return `${datePart} — ${hm.replace(':', 'h')}`
  } catch {
    return '—'
  }
}

/** En-tête : « 09 juin 2026 — 14:36 (UTC+1) ». */
function formatGenHeaderFr(d: Date): string {
  const datePart = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Brazzaville',
  }).format(d)
  const hm = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Brazzaville',
  }).format(d)
  return `${datePart} — ${hm} (UTC+1)`
}

/** Page 2 : « 09 / 06 / 2026 — 14:36 ». */
function formatGenSlashFr(d: Date): string {
  const p = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Africa/Brazzaville',
  }).formatToParts(d)
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  const hm = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Brazzaville',
  }).format(d)
  return `${get('day')} / ${get('month')} / ${get('year')} — ${hm}`
}

// ---------------------------------------------------------------------------
// Lecture défensive jsonb / app_config (zéro hardcode — Règle 11)
// ---------------------------------------------------------------------------

async function readGameName(config: unknown): Promise<string> {
  const fromConfig = pickGameName(config)
  if (fromConfig) return fromConfig
  const defaults = await getAppConfig('tournament_defaults')
  return pickGameName(defaults) ?? '—'
}

function pickGameName(source: unknown): string | null {
  const game = getObjectProp(source, 'game')
  const name = getObjectProp(game, 'name')
  return typeof name === 'string' && name.trim() ? name : null
}

/** LIEU = config.location.address (repli : location.name). */
function pickVenueAddress(config: unknown): string {
  const loc = getObjectProp(config, 'location')
  const addr = strOrNull(getObjectProp(loc, 'address'))
  if (addr) return addr
  const name = strOrNull(getObjectProp(loc, 'name'))
  return name ?? '—'
}

/** VILLE = config.location.city, country (repli : app_config.event_location). */
async function readCityLabel(config: unknown): Promise<string> {
  const loc = getObjectProp(config, 'location')
  const parts = [strOrNull(getObjectProp(loc, 'city')), strOrNull(getObjectProp(loc, 'country'))].filter(
    (v): v is string => v != null,
  )
  if (parts.length) return parts.join(', ')
  const ac = (await getAppConfig('event_location')) as unknown as
    | { city?: string; country?: string }
    | null
  const acParts = [ac?.city, ac?.country].filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  )
  return acParts.length ? acParts.join(', ') : '—'
}

/** Ville seule (en-tête « THE PLAYERS — <ville> »). */
async function readEventCity(config: unknown): Promise<string> {
  const loc = getObjectProp(config, 'location')
  const city = strOrNull(getObjectProp(loc, 'city'))
  if (city) return city
  const ac = (await getAppConfig('event_location')) as unknown as { city?: string } | null
  return typeof ac?.city === 'string' && ac.city.trim() ? ac.city : '—'
}

/** « 07:00 » → « 07h00 ». */
function pickArrivalTime(config: unknown): string {
  const schedule = getObjectProp(config, 'schedule')
  const t = getObjectProp(schedule, 'saturday_arrival')
  if (typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t)) {
    const [h = '', m = '00'] = t.split(':')
    return `${h.padStart(2, '0')}h${m}`
  }
  return '—'
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

function getObjectProp(source: unknown, key: string): unknown {
  if (source && typeof source === 'object' && key in source) {
    return (source as Record<string, unknown>)[key]
  }
  return undefined
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}