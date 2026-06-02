import { CalendarOff, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { FCFA } from '@/components/shared/FCFA'
import { ROUTES } from '@/config/routes'
import { getPlayerRegistrationForActive } from '@/lib/registrations/create'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveTournamentPublic,
  type PublicActiveTournament,
} from '@/lib/tournaments/active'
import { readPublicConfig } from '@/app/(public)/tournoi/components/config'

import { ReserveButton } from './components/ReserveButton'

/**
 * Page d'inscription au tournoi (réservation).
 *
 * Server Component. Lit le tournoi actif via la RPC PUBLIQUE (jamais la
 * capacité — Règle 1) et l'éventuelle inscription existante du joueur via la
 * logique métier (service_role, comptage interne).
 *
 * Trois états :
 *   - Déjà inscrit → renvoie vers paiement / dashboard.
 *   - Inscriptions ouvertes & pas inscrit → carte tournoi + ReserveButton.
 *   - Aucun tournoi / fermées → message neutre.
 *
 * Le montant d'inscription vient de la config publique (Règle 11 — zéro hardcode).
 */
export default async function PlayerRegistrationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.signIn)

  const tournament = await getActiveTournamentPublic()
  const existing = await getPlayerRegistrationForActive(user.id)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Inscription</h1>
        <p className="text-sm text-text-secondary">
          Réserve ta place pour le tournoi.
        </p>
      </header>

      {existing ? (
        <AlreadyRegistered status={existing.status} />
      ) : !tournament ? (
        <NeutralState
          icon={<CalendarOff className="h-6 w-6 text-text-muted" strokeWidth={1.75} />}
          title="Aucun tournoi en cours"
          message="Aucun tournoi n'est ouvert pour le moment. Reviens bientôt."
        />
      ) : !tournament.is_registrations_open ? (
        <NeutralState
          icon={<Lock className="h-6 w-6 text-text-muted" strokeWidth={1.75} />}
          title={tournament.name}
          message="Les inscriptions ne sont pas ouvertes pour l'instant."
        />
      ) : (
        <OpenRegistration tournament={tournament} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// États
// ---------------------------------------------------------------------------

function AlreadyRegistered({ status }: { status: string }) {
  const isReserved = status === 'reserved'
  const isAwaiting = status === 'awaiting_verification'
  const isConfirmed = status === 'confirmed'

  let message = 'Tu es inscrit à ce tournoi.'
  if (isReserved) message = 'Ta place est réservée. Finalise ton paiement.'
  else if (isAwaiting) message = 'Ta preuve de paiement est en cours de vérification.'
  else if (isConfirmed) message = 'Ton inscription est confirmée.'

  return (
    <section className="space-y-4 rounded-2xl bg-success-neon/10 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2
          className="mt-0.5 h-6 w-6 shrink-0 text-success-neon"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-text-primary">
            Déjà inscrit
          </h2>
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
      </div>

      {(isReserved || isAwaiting) && (
        <Button
          asChild
          className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
        >
          <Link href={ROUTES.player.payment}>Aller au paiement</Link>
        </Button>
      )}
    </section>
  )
}

function OpenRegistration({
  tournament,
}: {
  tournament: PublicActiveTournament
}) {
  const config = readPublicConfig(tournament)
  const fee = config.registration?.amount_fcfa ?? null

  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  const start = new Date(tournament.start_date).toLocaleDateString('fr-FR', opts)
  const end = new Date(tournament.end_date).toLocaleDateString('fr-FR', opts)
  const dateLabel = start === end ? start : `${start} → ${end}`

  return (
    <section className="space-y-5">
      <div className="space-y-3 rounded-2xl bg-surface-1 p-5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-accent-violet">
            Inscriptions ouvertes
          </p>
          <h2 className="text-lg font-semibold text-text-primary">
            {tournament.name}
          </h2>
          <p className="text-sm text-text-secondary">{dateLabel}</p>
        </div>

        {fee != null && (
          <div className="rounded-xl bg-surface-2 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">
              Frais d&apos;inscription
            </p>
            <p className="mt-1">
              <FCFA amount={fee} large />
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-surface-1 p-5">
        <p className="text-sm text-text-secondary">
          En réservant, tu obtiens une place. Tu disposeras ensuite d&apos;un
          délai pour finaliser ton paiement et confirmer ton inscription.
        </p>
      </div>

      <ReserveButton />
    </section>
  )
}

function NeutralState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode
  title: string
  message: string
}) {
  return (
    <section className="rounded-2xl bg-surface-1 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
      </div>
    </section>
  )
}