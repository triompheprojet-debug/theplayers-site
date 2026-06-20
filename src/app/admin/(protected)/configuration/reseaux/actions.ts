'use server'

import { revalidatePath } from 'next/cache'

import { ROUTES } from '@/config/routes'
import { logActivity } from '@/lib/activity/log'
import { requireSuperAdmin } from '@/lib/auth/permissions'
import { revalidateAppConfig } from '@/lib/config/app-config'
import { normalizePhone } from '@/lib/format/phone'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  socialContactSchema,
  type SocialContactFormValues,
} from '@/lib/validation/config'

import { actionError, actionSuccess, type ActionResult } from '@/types/api.types'
import type { ContactPhone, EventLocation, SocialLinks } from '@/types/config.types'

/**
 * Met à jour les clés app_config `social_links`, `contact_phones` et
 * `event_location` (SUPER_ADMIN uniquement — modification de app_config).
 *
 * - Re-valide l'entrée côté serveur (jamais confiance au client).
 * - Normalise les numéros en E.164 congolais (+242…) avant écriture.
 * - Invalide le cache app_config + les pages contact / accueil (pied de page)
 *   pour une propagation immédiate côté public.
 */
export async function updateSocialContactAction(
  input: SocialContactFormValues,
): Promise<ActionResult<{ updated: true }>> {
  const session = await requireSuperAdmin()

  const parsed = socialContactSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return actionError(first?.message ?? 'Données invalides.')
  }

  const { social_links, contact_phones, event_location } = parsed.data

  const social: SocialLinks = {
    facebook: social_links.facebook,
    instagram: social_links.instagram,
    tiktok: social_links.tiktok,
    whatsapp_public:
      social_links.whatsapp_public === ''
        ? ''
        : normalizePhone(social_links.whatsapp_public) ??
          social_links.whatsapp_public,
  }

  const phones: ContactPhone[] = contact_phones.map((p) => ({
    label: p.label,
    number: normalizePhone(p.number) ?? p.number,
    is_whatsapp: p.is_whatsapp,
  }))

  const location: EventLocation = {
    address: event_location.address,
    maps_url: event_location.maps_url,
    city: event_location.city,
    country: event_location.country,
  }

  const supabase = createServiceRoleClient()

  const writes: {
    key: string
    value: SocialLinks | ContactPhone[] | EventLocation
  }[] = [
    { key: 'social_links', value: social },
    { key: 'contact_phones', value: phones },
    { key: 'event_location', value: location },
  ]

  for (const w of writes) {
    // La colonne `value` est de type jsonb (Json). Le client Supabase typé
    // n'accepte pas directement un objet structuré sans index signature ;
    // on caste en `never` (même convention que activity/log.ts pour metadata).
    const { error } = await supabase
      .from('app_config')
      .update({ value: w.value as never, updated_by: session.adminId })
      .eq('key', w.key)

    if (error) {
      return actionError(
        `Échec de l'enregistrement (${w.key}) : ${error.message}`,
      )
    }
  }

  await revalidateAppConfig()

  await logActivity({
    adminId: session.adminId,
    actionType: 'update_social_contact',
    targetTable: 'app_config',
    description: `Réseaux & coordonnées mis à jour (${phones.length} numéro(s)).`,
    metadata: { phones_count: phones.length },
  })

  revalidatePath(ROUTES.admin.configuration.social)
  revalidatePath(ROUTES.contact)
  revalidatePath(ROUTES.home)

  return actionSuccess({ updated: true })
}