import { AlertTriangle, ArrowRight, CalendarOff, Lock, Trophy } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveTournamentPublic,
  type PublicActiveTournament,
} from '@/lib/tournaments/active'

/**
 * Dashboard joueur.
 *
 * Server Component : lit le profil via le client serveur et le tournoi actif
 * via la RPC PUBLIQUE (`getActiveTournamentPublic`) — JAMAIS l'accès admin,
 * pour ne pas exposer la capacité (Règle 1).
 *
 * Carte de statut adaptative — états câblés en M07 :
 *  1. Aucun tournoi actif → message neutre.
 *  2. Tournoi actif + inscriptions ouvertes → invitation à s'inscrire (violet).
 *  3. Tournoi actif + inscriptions fermées → message neutre.
 * Les états « réservé / payé / confirmé » arrivent en M08/M09.
 */
export default async function PlayerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) redirect(ROUTES.signIn)

  const tournament = await getActiveTournamentPublic()

  return (
    <div className="space-y-6">
      {/* En-tête : pseudo en très grand (Règle 2) */}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Bienvenue
        </p>
        <PlayerPseudo pseudo={profile.pseudo} size="xl" />
      </header>

      {profile.is_blocked && <BlockedBanner blockedUntil={profile.blocked_until} />}

      <StatusCard tournament={tournament} />

      <StatsStrip
        points={profile.total_points}
        played={profile.tournaments_played}
        bestFinish={profile.best_finish}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bannière compte bloqué (danger)
// ---------------------------------------------------------------------------

function BlockedBanner({ blockedUntil }: { blockedUntil: string | null }) {
  const until = blockedUntil
    ? new Date(blockedUntil).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-danger/10 p-4">
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-danger"
        strokeWidth={2}
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-semibold text-danger">Compte suspendu</p>
        <p className="text-sm text-text-secondary">
          {until
            ? `Ton accès aux inscriptions est suspendu jusqu'au ${until}.`
            : 'Ton accès aux inscriptions est actuellement suspendu.'}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Carte de statut adaptative
// ---------------------------------------------------------------------------

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  const s = new Date(start).toLocaleDateString('fr-FR', opts)
  const e = new Date(end).toLocaleDateString('fr-FR', opts)
  return s === e ? s : `${s} → ${e}`
}

function StatusCard({
  tournament,
}: {
  tournament: PublicActiveTournament | null
}) {
  // État 1 — aucun tournoi actif
  if (!tournament) {
    return (
      <section className="rounded-2xl bg-surface-1 p-5">
        <div className="flex items-start gap-3">
          <CalendarOff
            className="mt-0.5 h-6 w-6 shrink-0 text-text-muted"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-primary">
              Aucun tournoi en cours
            </h2>
            <p className="text-sm text-text-secondary">
              Aucun tournoi n&apos;est ouvert pour le moment. Reviens bientôt
              pour le prochain rendez-vous.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // État 3 — tournoi actif mais inscriptions fermées
  if (!tournament.is_registrations_open) {
    return (
      <section className="rounded-2xl bg-surface-1 p-5">
        <div className="flex items-start gap-3">
          <Lock
            className="mt-0.5 h-6 w-6 shrink-0 text-text-muted"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-text-primary">
                {tournament.name}
              </h2>
              <p className="text-sm text-text-secondary">
                {formatRange(tournament.start_date, tournament.end_date)}
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              Les inscriptions ne sont pas ouvertes pour l&apos;instant.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // État 2 — tournoi actif + inscriptions ouvertes (pas encore inscrit)
  // NOTE M08 : remplacer le CTA « Découvrir » par l'action de réservation
  // (createReservation) une fois la table `registrations` en place.
  return (
    <section className="space-y-4 rounded-2xl bg-accent-violet/10 p-5">
      <div className="flex items-start gap-3">
        <Trophy
          className="mt-0.5 h-6 w-6 shrink-0 text-accent-violet"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-accent-violet">
            Inscriptions ouvertes
          </p>
          <h2 className="text-lg font-semibold text-text-primary">
            {tournament.name}
          </h2>
          <p className="text-sm text-text-secondary">
            {formatRange(tournament.start_date, tournament.end_date)}
          </p>
        </div>
      </div>

      <p className="text-sm text-text-secondary">
        Tu n&apos;es pas encore inscrit à ce tournoi.
      </p>

      <Button
        asChild
        className="min-h-[48px] w-full bg-accent-violet text-white hover:bg-accent-violet/90"
      >
        <Link href={ROUTES.tournament}>
          Découvrir le tournoi
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Bande de statistiques (lecture seule)
// ---------------------------------------------------------------------------

function StatsStrip({
  points,
  played,
  bestFinish,
}: {
  points: number
  played: number
  bestFinish: string | null
}) {
  const cells = [
    { label: 'Points', value: String(points) },
    { label: 'Tournois', value: String(played) },
    { label: 'Meilleur', value: bestFinish ?? '—' },
  ]

  return (
    <section>
      <h2 className="mb-3 text-xs uppercase tracking-wider text-text-secondary">
        Mes statistiques
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {cells.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl bg-surface-2 px-3 py-4 text-center"
          >
            <p className="truncate text-2xl font-bold text-text-primary">
              {value}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}