import {
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  TriangleAlert,
} from 'lucide-react'
import type { Metadata } from 'next'
import type { IconType } from 'react-icons'
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6'

import { getAppConfig } from '@/lib/config/app-config'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Contact — THE PLAYERS',
  description:
    'Contactez Liga Esport FC : téléphone, WhatsApp, réseaux sociaux et lieu de l\u2019événement.',
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

  const waPublic = socialLinks?.whatsapp_public
  const waHref = waPublic
    ? `https://wa.me/${waPublic.replace(/[^0-9]/g, '')}`
    : null
  const callPhone = phones?.find((p) => !p.is_whatsapp) ?? phones?.[0]
  const hasJoindre =
    (phones && phones.length > 0) ||
    Boolean(waPublic) ||
    Boolean(location?.city || location?.address)

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <header className="text-center">
        <h1 className="text-3xl font-black text-text-primary md:text-5xl">
          Contact
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-text-secondary md:text-base">
          Une question, une inscription ou un partenariat ? Notre équipe vous
          répond rapidement.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4">
        {/* Nous joindre */}
        {hasJoindre && (
          <div className="rounded-2xl bg-surface-1 p-6">
            <div className="flex items-center gap-2">
              <Mail className="size-5 text-accent-violet" aria-hidden />
              <h2 className="text-base font-bold text-text-primary">
                Nous joindre
              </h2>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {phones?.map((phone) => {
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
                      className="flex min-h-12 items-center gap-3 rounded-md px-2 text-text-primary active:bg-surface-2"
                    >
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold">{phone.label}</span>
                        <span className="font-mono text-sm text-text-secondary">
                          {phone.number}
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}

              {waHref && (
                <li>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center gap-3 rounded-md px-2 text-text-primary active:bg-surface-2"
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-success-neon">
                      <FaWhatsapp className="size-5" aria-hidden />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">WhatsApp</span>
                      <span className="font-mono text-sm text-text-secondary">
                        {waPublic}
                      </span>
                    </span>
                  </a>
                </li>
              )}

              {(location?.city || location?.address) && (
                <li className="flex items-start gap-3 px-2 py-2">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                    <MapPin className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {[location.address, location.city, location.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {location.maps_url && (
                      <a
                        href={location.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-violet"
                      >
                        Ouvrir dans Google Maps
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    )}
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Suivez-nous */}
        {socials.length > 0 && (
          <div className="rounded-2xl bg-surface-1 p-6">
            <div className="flex items-center gap-2">
              <Share2 className="size-5 text-accent-violet" aria-hidden />
              <h2 className="text-base font-bold text-text-primary">
                Suivez-nous
              </h2>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {socials.map(({ key, href, label, icon: Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-between gap-2 rounded-md bg-surface-2 px-4 text-sm font-semibold text-text-primary active:scale-[0.98]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="size-4 text-accent-violet" aria-hidden />
                      {label}
                    </span>
                    <ExternalLink className="size-4 text-text-muted" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Assistance immédiate */}
        {(callPhone || waHref) && (
          <div className="rounded-2xl bg-surface-1 p-6 shadow-glow-violet">
            <div className="flex items-center gap-2 text-accent-violet">
              <TriangleAlert className="size-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Assistance immédiate
              </span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-text-primary">
              {"Besoin d'aide le jour du tournoi ?"}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {"Support disponible en priorité pour les joueurs en lice lors d'un événement."}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {callPhone && (
                <a
                  href={`tel:${callPhone.number}`}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-surface-2 px-4 font-semibold text-text-primary active:scale-[0.98]"
                >
                  <Phone className="size-4" aria-hidden />
                  Appeler
                </a>
              )}
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-surface-2 px-4 font-semibold text-success-neon active:scale-[0.98]"
                >
                  <FaWhatsapp className="size-4" aria-hidden />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
} 