import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  CalendarDays,
  CalendarOff,
  ChevronRight,
  Clock,
  Download,
  FileText,
  FolderOpen,
  HelpCircle,
  Hourglass,
  Lock,
  MapPin,
  Network,
  Trophy,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveTournamentPublic,
  type PublicActiveTournament,
} from '@/lib/tournaments/active'

/**
 * Dashboard joueur (hub).
 *
 * Server Component. Lit : profil (SSR), tournoi actif (RPC publique — jamais
 * la capacité, Règle 1), inscription + paiement du joueur (RLS « own »),
 * derniers messages reçus (RLS recipient_player_id = auth.uid()).
 *
 * Carte de statut adaptative pilotée par registrations.status :
 *  confirmed → badge ; awaiting_verification → en attente ; rejected → motif
 *  (payments.rejection_reason) ; reserved → paiement requis ; sinon → invitation.
 */
export default async function PlayerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const { data: profile } = await supabase
    .from('profiles')
    .select('pseudo, is_blocked, blocked_until')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) redirect(ROUTES.signIn)

  const tournament = await getActiveTournamentPublic()

  // Inscription du joueur pour le tournoi actif (hors annulées, la plus récente)
  let registration: {
    id: string
    status: PublicActiveTournament extends never ? never : string
    badge_number: number | null
  } | null = null
  let rejectionReason: string | null = null

  if (tournament) {
    const { data: reg } = await supabase
      .from('registrations')
      .select('id, status, badge_number')
      .eq('player_id', user.id)
      .eq('tournament_id', tournament.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    registration = reg

    if (reg?.status === 'rejected') {
      const { data: pay } = await supabase
        .from('payments')
        .select('rejection_reason')
        .eq('registration_id', reg.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      rejectionReason = pay?.rejection_reason ?? null
    }
  }

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('id, subject, body, read_at')
    .eq('recipient_player_id', user.id)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(3)

  const isConfirmed = registration?.status === 'confirmed'

  return (
    <div className="pb-6">
      {/* Bandeau « imprimer le badge » — uniquement si inscription confirmée */}
      {isConfirmed ? (
        <div className="flex items-center gap-2 bg-warning/10 px-4 py-3 text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Imprime ton badge avant le jour J
          </p>
        </div>
      ) : null}

      <div className="space-y-6 px-4 pt-5">
        {/* En-tête : pseudo en très grand (Règle 2) + contexte tournoi */}
        <header className="space-y-1">
          <PlayerPseudo pseudo={profile.pseudo} size="xl" />
          {tournament ? (
            <p className="text-xs font-bold uppercase tracking-wider text-accent-violet">
              {tournament.name}
            </p>
          ) : null}
        </header>

        {profile.is_blocked ? (
          <BlockedBanner blockedUntil={profile.blocked_until} />
        ) : null}

        <StatusCard
          tournament={tournament}
          registration={registration}
          rejectionReason={rejectionReason}
          isBlocked={Boolean(profile.is_blocked)}
        />

        <QuickGrid />

        {tournament ? <NextEventCard tournament={tournament} /> : null}

        <RecentMessages messages={recentMessages ?? []} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types JSON (cast présentationnel — RPC renvoie `unknown`)
// ---------------------------------------------------------------------------

type ScheduleInfo = {
  saturday_arrival?: string | null
  sunday_arrival?: string | null
  ceremony_time?: string | null
}

type LocationInfo = {
  address?: string | null
  city?: string | null
  maps_url?: string | null
}

// ---------------------------------------------------------------------------
// Bannière compte bloqué
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
            : "Ton accès aux inscriptions est actuellement suspendu."}
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
  registration,
  rejectionReason,
  isBlocked,
}: {
  tournament: PublicActiveTournament | null
  registration: { id: string; status: string; badge_number: number | null } | null
  rejectionReason: string | null
  isBlocked: boolean
}) {
  // Confirmé (prioritaire — badge pertinent même inscriptions fermées)
  if (registration?.status === 'confirmed') {
    return (
      <section className="space-y-4 rounded-2xl bg-success-neon/10 p-5">
        <div className="flex items-center gap-2 text-success-neon">
          <BadgeCheck className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Inscription confirmée
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            N° joueur
          </p>
          <p className="font-mono text-4xl font-bold text-text-primary">
            {registration.badge_number != null
              ? `#${registration.badge_number}`
              : '—'}
          </p>
        </div>

        <div className="space-y-2">
          <Button
            asChild
            className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
          >
            <Link href={ROUTES.player.documents}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Télécharger le badge
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="min-h-12 w-full bg-surface-2 text-text-primary hover:bg-surface-3"
          >
            <Link href={ROUTES.player.documents}>
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Voir mes documents
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  // En attente de vérification
  if (registration?.status === 'awaiting_verification') {
    return (
      <section className="space-y-3 rounded-2xl bg-warning/10 p-5">
        <div className="flex items-center gap-2 text-warning">
          <Hourglass className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider">
            En attente de vérification
          </p>
        </div>
        <p className="text-sm text-text-secondary">
          {"Ton paiement est en cours de vérification. Tu recevras une confirmation dès qu'il est validé."}
        </p>
        <Button
          asChild
          variant="secondary"
          className="min-h-12 w-full bg-surface-2 text-text-primary hover:bg-surface-3"
        >
          <Link href={ROUTES.contact}>Contacter le support</Link>
        </Button>
      </section>
    )
  }

  // Rejeté (motif = payments.rejection_reason)
  if (registration?.status === 'rejected') {
    return (
      <section className="space-y-3 rounded-2xl bg-danger/10 p-5">
        <div className="flex items-center gap-2 text-danger">
          <AlertCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Paiement rejeté
          </p>
        </div>
        {rejectionReason ? (
          <p className="text-sm text-text-secondary">{rejectionReason}</p>
        ) : (
          <p className="text-sm text-text-secondary">
            {"Ton paiement n'a pas pu être validé. Soumets une nouvelle preuve."}
          </p>
        )}
        <Button
          asChild
          className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
        >
          <Link href={ROUTES.player.payment}>
            Soumettre à nouveau
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    )
  }

  // Réservé — paiement non finalisé
  if (registration?.status === 'reserved') {
    return (
      <section className="space-y-3 rounded-2xl bg-accent-violet/10 p-5">
        <div className="flex items-center gap-2 text-accent-violet">
          <Wallet className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Paiement requis
          </p>
        </div>
        <p className="text-sm text-text-secondary">
          {"Ta place est réservée. Finalise ton paiement pour confirmer ton inscription."}
        </p>
        <Button
          asChild
          className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
        >
          <Link href={ROUTES.player.payment}>
            Finaliser le paiement
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    )
  }

  // Aucun tournoi actif
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
              {"Aucun tournoi n'est ouvert pour le moment. Reviens bientôt pour le prochain rendez-vous."}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Tournoi actif mais inscriptions fermées
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
              {"Les inscriptions ne sont pas ouvertes pour l'instant."}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Inscriptions ouvertes mais compte bloqué
  if (isBlocked) {
    return (
      <section className="rounded-2xl bg-surface-1 p-5">
        <div className="flex items-start gap-3">
          <Lock
            className="mt-0.5 h-6 w-6 shrink-0 text-text-muted"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-primary">
              {tournament.name}
            </h2>
            <p className="text-sm text-text-secondary">
              Les inscriptions sont suspendues pour ton compte.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Inscriptions ouvertes — pas encore inscrit
  return (
    <section className="space-y-4 rounded-2xl bg-accent-violet/10 p-5">
      <div className="flex items-start gap-3">
        <Trophy
          className="mt-0.5 h-6 w-6 shrink-0 text-accent-violet"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-violet">
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

      <Button
        asChild
        className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
      >
        <Link href={ROUTES.player.registration}>
          {"S'inscrire au tournoi"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Grille d'accès rapide
// ---------------------------------------------------------------------------

interface QuickLink {
  href: string
  icon: LucideIcon
  label: string
}

const QUICK_LINKS: QuickLink[] = [
  { href: ROUTES.player.documents, icon: FileText, label: 'Documents' },
  { href: ROUTES.player.payment, icon: Banknote, label: 'Paiement' },
  { href: ROUTES.tournament, icon: CalendarDays, label: 'Programme' },
  { href: ROUTES.contact, icon: HelpCircle, label: 'Aide' },
  { href: ROUTES.player.bracket, icon: Network, label: 'Mon bracket' },
  { href: ROUTES.player.ranking, icon: BarChart3, label: 'Classement' },
]

function QuickGrid() {
  return (
    <section className="grid grid-cols-2 gap-3">
      {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
        <Link
          key={label}
          href={href}
          className={cn(
            'flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-1 p-4 text-center',
            'transition-colors hover:bg-surface-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
          )}
        >
          <Icon className="h-6 w-6 text-accent-violet" strokeWidth={2} aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide text-text-primary">
            {label}
          </span>
        </Link>
      ))}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Prochain événement
// ---------------------------------------------------------------------------

function EventDateBox({ date }: { date: string }) {
  const d = new Date(`${date}T00:00:00`)
  const weekday = d
    .toLocaleDateString('fr-FR', { weekday: 'short' })
    .replace('.', '')
    .toUpperCase()
  const day = d.toLocaleDateString('fr-FR', { day: 'numeric' })

  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-violet/15">
      <span className="text-[10px] font-bold uppercase tracking-wide text-accent-violet">
        {weekday}
      </span>
      <span className="font-mono text-xl font-bold leading-none text-text-primary">
        {day}
      </span>
    </div>
  )
}

function NextEventCard({ tournament }: { tournament: PublicActiveTournament }) {
  const schedule = (tournament.schedule_info ?? null) as ScheduleInfo | null
  const location = (tournament.location_info ?? null) as LocationInfo | null

  const arrival = schedule?.saturday_arrival ?? schedule?.sunday_arrival ?? null
  const place = [location?.address, location?.city].filter(Boolean).join(', ')

  if (!place && !arrival) return null

  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-text-primary">Prochain événement</h2>
      <div className="flex items-center gap-4 rounded-2xl bg-surface-1 p-4">
        <EventDateBox date={tournament.start_date} />
        <div className="min-w-0 space-y-2">
          {place ? (
            location?.maps_url ? (
              <a
                href={location.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-text-primary"
              >
                <MapPin className="h-4 w-4 shrink-0 text-accent-violet" aria-hidden="true" />
                <span className="truncate">{place}</span>
              </a>
            ) : (
              <p className="flex items-center gap-2 text-sm text-text-primary">
                <MapPin className="h-4 w-4 shrink-0 text-accent-violet" aria-hidden="true" />
                <span className="truncate">{place}</span>
              </p>
            )
          ) : null}
          {arrival ? (
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock className="h-4 w-4 shrink-0 text-accent-violet" aria-hidden="true" />
              <span>{`Heure d'accueil : ${arrival}`}</span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Derniers messages
// ---------------------------------------------------------------------------

function RecentMessages({
  messages,
}: {
  messages: { id: string; subject: string | null; body: string | null; read_at: string | null }[]
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-text-primary">Derniers messages</h2>
        <Link
          href={ROUTES.player.messages}
          className="text-xs font-semibold uppercase tracking-wide text-accent-violet"
        >
          Voir tout
        </Link>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-2xl bg-surface-1 px-4 py-5 text-sm text-text-secondary">
          Aucun message pour le moment.
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => (
            <li key={m.id}>
              <Link
                href={ROUTES.player.messageDetail(m.id)}
                className="flex items-center gap-3 rounded-xl bg-surface-1 p-3 transition-colors hover:bg-surface-2"
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    m.read_at ? 'bg-transparent' : 'bg-accent-violet',
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">
                    {m.subject ?? 'Message'}
                  </p>
                  {m.body ? (
                    <p className="truncate text-sm text-text-secondary">{m.body}</p>
                  ) : null}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}