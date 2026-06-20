import { requireSuperAdmin } from '@/lib/auth/permissions'
import { getAppConfig } from '@/lib/config/app-config'

import { ConfigTabs } from '../components/ConfigTabs'
import { SocialContactForm } from './components/SocialContactForm'

import type { SocialContactFormValues } from '@/lib/validation/config'

export const metadata = {
  title: 'Réseaux & coordonnées — Admin',
  robots: { index: false, follow: false },
}

const EMPTY_SOCIAL = {
  facebook: '',
  instagram: '',
  tiktok: '',
  whatsapp_public: '',
}
const EMPTY_LOCATION = { address: '', maps_url: '', city: '', country: '' }

/**
 * Configuration des réseaux sociaux, numéros de contact et lieu de l'événement
 * (SUPER_ADMIN). Les valeurs alimentent la page contact publique et le pied de
 * page. Lecture via getAppConfig (cache invalidé par la Server Action au save).
 */
export default async function ReseauxConfigPage() {
  await requireSuperAdmin()

  const [social, phones, location] = await Promise.all([
    getAppConfig('social_links'),
    getAppConfig('contact_phones'),
    getAppConfig('event_location'),
  ])

  const initialValues: SocialContactFormValues = {
    social_links: { ...EMPTY_SOCIAL, ...(social ?? {}) },
    contact_phones: (phones ?? []).map((p) => ({
      label: p.label,
      number: p.number,
      is_whatsapp: Boolean(p.is_whatsapp),
    })),
    event_location: { ...EMPTY_LOCATION, ...(location ?? {}) },
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Configuration
        </p>
        <h1 className="text-2xl font-bold text-text-primary">
          Réseaux &amp; coordonnées
        </h1>
        <p className="text-sm text-text-muted">
          Réseaux sociaux, numéros de contact et lieu — affichés sur la page
          contact et le pied de page public.
        </p>
      </header>

      <ConfigTabs />

      <SocialContactForm initialValues={initialValues} />
    </div>
  )
}