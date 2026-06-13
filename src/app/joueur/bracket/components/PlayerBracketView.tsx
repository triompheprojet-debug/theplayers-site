'use client'

import { useEffect, useState } from 'react'
import { CircleUserRound, Info, Share2 } from 'lucide-react'

import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRealtimeBracket } from '@/hooks/useRealtimeBracket'

import { PublicBracket } from '@/app/(public)/bracket/components/PublicBracket'

import type { BracketMatchRealtime } from '@/lib/realtime/bracket-channel'

/**
 * « Mon Bracket » côté joueur (M14) — mobile-first.
 *
 * - Récupère le pseudo du joueur courant (lecture de son propre profil, RLS
 *   own-profile) pour identifier ses matchs sans exposer d'identifiants.
 * - Affiche une carte « Votre premier match » (adversaire, vague, heure) tirée
 *   du round 1, puis réutilise `PublicBracket` avec `highlightPseudo`.
 * - Bannière « hors saison » conditionnée au type du tournoi (pas en dur).
 *
 * Pas de `setState` synchrone dans l'effet : le pseudo est posé dans le
 * callback `.then` de la requête (règle `react-hooks/set-state-in-effect`).
 */
interface PlayerBracketViewProps {
  tournamentId: string
  tournamentName: string
  isOffSeason: boolean
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
  forfeit: 'Forfait',
  cancelled: 'Annulé',
}

export function PlayerBracketView({
  tournamentId,
  tournamentName,
  isOffSeason,
}: PlayerBracketViewProps) {
  const supabase = useSupabase()
  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id ?? null

  const [myPseudo, setMyPseudo] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    void supabase
      .from('profiles')
      .select('pseudo')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.pseudo) setMyPseudo(data.pseudo)
      })
    return () => {
      active = false
    }
  }, [supabase, userId])

  const { matches } = useRealtimeBracket(tournamentId)

  // Premier match du joueur (round 1)
  const firstMatch = myPseudo
    ? matches.find(
        (m) =>
          m.round_number === 1 &&
          (m.player_a_pseudo === myPseudo || m.player_b_pseudo === myPseudo),
      )
    : undefined

  async function handleShare() {
    if (typeof navigator === 'undefined' || !navigator.share) return
    try {
      await navigator.share({
        title: 'Mon Bracket',
        text: `Suivez le bracket de ${tournamentName}`,
        url: window.location.href,
      })
    } catch {
      // Partage annulé : aucune action.
    }
  }

  return (
    <div className="px-4 pb-24 pt-6">
      {/* En-tête */}
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-text-primary">
          Mon Bracket
        </h1>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Partager"
          className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-accent-violet transition-colors hover:bg-surface-3"
        >
          <Share2 className="size-5" aria-hidden />
        </button>
      </header>

      {/* Bannière contextuelle */}
      {isOffSeason && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-surface-1 px-4 py-3">
          <Info className="size-4 shrink-0 text-text-secondary" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Hors saison — aucun point de ligue
          </span>
        </div>
      )}

      {/* Carte « Votre premier match » */}
      {firstMatch && myPseudo && (
        <FirstMatchCard match={firstMatch} myPseudo={myPseudo} />
      )}

      {/* Arbre complet (réutilise le composant public, highlight joueur) */}
      <div className="mt-2">
        <PublicBracket
          tournamentId={tournamentId}
          highlightPseudo={myPseudo}
        />
      </div>
    </div>
  )
}

function FirstMatchCard({
  match,
  myPseudo,
}: {
  match: BracketMatchRealtime
  myPseudo: string
}) {
  const amA = match.player_a_pseudo === myPseudo
  const opponent = amA ? match.player_b_pseudo : match.player_a_pseudo
  const myBadge = amA ? match.player_a_badge : match.player_b_badge

  const time = match.scheduled_time
    ? new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Brazzaville',
      }).format(new Date(match.scheduled_time))
    : null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-accent-violet">
        Votre premier match
      </h2>
      <div className="relative overflow-hidden rounded-2xl bg-surface-1 p-4">
        <div className="absolute -right-10 -top-10 size-32 rounded-full bg-accent-violet/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2">
              <CircleUserRound
                className="size-5 text-text-secondary"
                aria-hidden
              />
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Adversaire
              </span>
              <span className="block truncate text-lg font-semibold text-text-primary">
                {opponent ?? 'À déterminer'}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            {match.wave_number != null && (
              <span className="font-mono text-sm text-accent-violet">
                Vague {match.wave_number}
              </span>
            )}
            {time && (
              <span className="mt-0.5 font-mono text-sm text-text-primary">
                {time}
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          <span>{STATUS_LABELS[match.status] ?? match.status}</span>
          <span className="flex items-center gap-3">
            {myBadge != null && <span>Badge #{myBadge}</span>}
            {match.console_number != null && (
              <span>Console {match.console_number}</span>
            )}
          </span>
        </div>
      </div>
    </section>
  )
}