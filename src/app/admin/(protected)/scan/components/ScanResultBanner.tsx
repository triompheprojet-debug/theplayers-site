'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'

import type { ScanResult } from '@/lib/qr/verify'

type InvalidReason = Extract<ScanResult, { valid: false }>['reason']

const REASON_LABEL: Record<InvalidReason, string> = {
  corrupted: 'QR illisible',
  invalid_signature: 'Signature falsifiee',
  wrong_tournament: 'Badge d un autre tournoi',
  already_scanned: 'Badge deja scanne',
  unknown_player: 'Joueur inconnu',
}

/**
 * Bandeau de resultat plein cadre, lisible a distance (jour J).
 * Vert = valide (pseudo + numero en GRAND) ; rouge = refus avec le motif.
 */
export function ScanResultBanner({ result }: { result: ScanResult }) {
  if (result.valid) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-success-neon/15 p-8 text-center ring-2 ring-success-neon/40">
        <CheckCircle2 className="size-16 text-success-neon" aria-hidden />
        <span className="text-sm font-semibold uppercase tracking-wider text-success-neon">
          Acces autorise
        </span>
        <PlayerPseudo pseudo={result.pseudo} size="lg" />
        <div className="rounded-xl bg-surface-2 px-6 py-3">
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Badge
          </p>
          <p className="text-4xl font-extrabold text-text-primary">
            #{result.badgeNumber}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-danger/15 p-8 text-center ring-2 ring-danger/40">
      <XCircle className="size-16 text-danger" aria-hidden />
      <span className="text-sm font-semibold uppercase tracking-wider text-danger">
        Acces refuse
      </span>
      <p className="text-2xl font-bold text-text-primary">
        {REASON_LABEL[result.reason]}
      </p>
      {result.details ? (
        <p className="text-sm text-text-secondary">{result.details}</p>
      ) : null}
    </div>
  )
}