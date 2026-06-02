import { redirect } from 'next/navigation'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { ROUTES } from '@/config/routes'
import { createClient } from '@/lib/supabase/server'

import { PasswordSection } from './components/PasswordSection'
import { ProfileForm } from './components/ProfileForm'

/**
 * Page profil joueur.
 *
 * Server Component : lit le profil via le client serveur, affiche le pseudo
 * en lecture seule (immuable, Règle 2) puis délègue l'édition aux deux
 * sous-composants Client.
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

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Mon profil</h1>
        <p className="text-sm text-text-secondary">
          Gère tes informations et ton mot de passe.
        </p>
      </header>

      {/* Pseudo — lecture seule */}
      <section className="rounded-2xl bg-surface-1 p-5">
        <p className="mb-2 text-xs uppercase tracking-wider text-text-secondary">
          Pseudo
        </p>
        <PlayerPseudo pseudo={profile.pseudo} size="lg" />
        <p className="mt-3 text-sm text-text-secondary">
          Le pseudo est ton identifiant : il ne peut pas être modifié.
        </p>
      </section>

      {/* Informations personnelles */}
      <section className="space-y-4 rounded-2xl bg-surface-1 p-5">
        <h2 className="text-lg font-semibold text-text-primary">
          Informations personnelles
        </h2>
        <ProfileForm
          defaultValues={{
            firstName: profile.first_name ?? '',
            lastName: profile.last_name ?? '',
            phone: profile.phone,
          }}
        />
      </section>

      {/* Sécurité */}
      <section className="space-y-4 rounded-2xl bg-surface-1 p-5">
        <h2 className="text-lg font-semibold text-text-primary">Sécurité</h2>
        <PasswordSection />
      </section>
    </div>
  )
}