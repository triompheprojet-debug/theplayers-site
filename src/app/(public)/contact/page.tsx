import { ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import type { IconType } from 'react-icons'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa6'

import { getAppConfig } from '@/lib/config/app-config'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Contact — THE PLAYERS',
  description:
    'Contactez Liga Esport FC via WhatsApp, réseaux sociaux, et retrouvez le lieu de l\u2019événement.',
}

export default async function ContactPage() {
  const [phones, socialLinks, location] = await Promise.all([
    getAppConfig('contact_phones'),
    getAppConfig('social_links'),
    getAppConfig('event_location'),
  ])

  const socials: Array<{ key: string; href: string; label: string; icon: IconType }> = []
  if (socialLinks?.facebook) {
    socials.push({ key: 'fb', href: socialLinks.facebook, label: 'Facebook', icon: FaFacebookF })
  }
  if (socialLinks?.instagram) {
    socials.push({ key: 'ig', href: socialLinks.instagram, label: 'Instagram', icon: FaInstagram })
  }
  if (socialLinks?.tiktok) {
    socials.push({ key: 'tt', href: socialLinks.tiktok, label: 'TikTok', icon: FaTiktok })
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-text-primary md:text-4xl">
          Contact
        </h1>
        <p className="text-sm text-text-secondary">
          Une question ? Contactez-nous directement.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4">
        {/* Téléphones / WhatsApp */}
        {phones && phones.length > 0 && (
          <div className="rounded-2xl bg-surface-1 p-6">
            <h2 className="text-xs uppercase tracking-wider text-text-secondary">
              Téléphone
            </h2>
            <ul className="mt-4 space-y-2">
              {phones.map((phone) => {
                const href = phone.is_whatsapp
                  ? `https://wa.me/${phone.number.replace(/[^0-9]/g, '')}`
                  : `tel:${phone.number}`
                const Icon = phone.is_whatsapp ? MessageCircle : Phone
                return (
                  <li key={phone.number}>
                    <a
                      href={href}
                      target={phone.is_whatsapp ? '_blank' : undefined}
                      rel={phone.is_whatsapp ? 'noopener noreferrer' : undefined}
                      className="flex min-h-[48px] items-center gap-3 rounded-md px-2 text-text-primary active:bg-surface-2"
                    >
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {phone.label}
                        </span>
                        <span className="font-mono text-sm text-text-secondary">
                          {phone.number}
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Réseaux sociaux */}
        {socials.length > 0 && (
          <div className="rounded-2xl bg-surface-1 p-6">
            <h2 className="text-xs uppercase tracking-wider text-text-secondary">
              Réseaux sociaux
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {socials.map(({ key, href, label, icon: Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-surface-2 px-4 text-sm font-semibold text-text-primary active:scale-[0.98]"
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lieu */}
        {location?.address && (
          <div className="rounded-2xl bg-surface-1 p-6">
            <h2 className="text-xs uppercase tracking-wider text-text-secondary">
              Lieu de l&apos;événement
            </h2>
            <div className="mt-4 flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                <MapPin className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {location.address}
                </p>
                <p className="text-sm text-text-secondary">
                  {[location.city, location.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {location.maps_url && (
                  <a
                    href={location.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-accent-violet"
                  >
                    Ouvrir dans Google Maps
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}