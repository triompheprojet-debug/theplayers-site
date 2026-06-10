import { CircleUserRound, LogOut } from 'lucide-react'
import { redirect } from 'next/navigation'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

import { PasswordSection } from './components/PasswordSection'
import { ProfileForm } from './components/ProfileForm'

/**
 * Page profil joueur.
 *
 * Identité : pseudo immuable (Règle 2), avatar = icône Lucide cohérente
 * (pas de photo). Édition first/last/phone via ProfileForm ; mot de passe
 * via PasswordSection (logique inchangée).
 *
 * TODO refonte (NON codé — dépend de M14) : « Historique de participation »
 * (TOP X / points par tournoi terminé). À câbler quand les positions/points
 * seront renseignés par les brackets. Lecture des noms de tournois via
 * service_role (tournaments est RLS-bloquée pour le joueur ; ne jamais lire
 * `capacity` — Règle 1).
 */
export default async function PlayerProfilePage() {
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

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="space-y-8 px-4 py-6">
      {/* Identité — avatar = icône cohérente (pas de photo) */}
      <section className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-2 ring-2 ring-accent-violet/40">
          <CircleUserRound
            className="h-12 w-12 text-accent-violet"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <PlayerPseudo pseudo={profile.pseudo} size="lg" />
          {fullName ? (
            <p className="text-sm text-text-secondary">{fullName}</p>
          ) : null}
          <p className="text-xs text-text-muted">Identifiant non modifiable</p>
        </div>
      </section>

      {/* Informations personnelles */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-accent-violet">
          Informations personnelles
        </h2>
        <div className="rounded-2xl bg-surface-1 p-5">
          <ProfileForm
            defaultValues={{
              firstName: profile.first_name ?? '',
              lastName: profile.last_name ?? '',
              phone: profile.phone,
            }}
          />
        </div>
      </section>

      {/* Sécurité & connexion */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-accent-violet">
          {'Sécurité & connexion'}
        </h2>
        <div className="rounded-2xl bg-surface-1 p-5">
          <PasswordSection />
        </div>
      </section>

      {/* Déconnexion (POST /deconnexion — cohérent avec le menu avatar) */}
      <form action={ROUTES.signOut} method="post">
        <button
          type="submit"
          className={cn(
            'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-danger',
            'transition-colors hover:bg-danger/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet',
          )}
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span className="font-semibold uppercase tracking-wide">
            Se déconnecter
          </span>
        </button>
      </form>
    </div>
  )
}