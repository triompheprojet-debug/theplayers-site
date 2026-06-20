import {
  ExternalLink,
  Headset,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  TriangleAlert,
} from 'lucide-react'
import Image from 'next/image'
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
  const hasContactMethod = (phones && phones.length > 0) || Boolean(waPublic)
  const locationLine =
    [location?.address, location?.city, location?.country]
      .filter(Boolean)
      .join(', ') || 'Pointe-Noire, République du Congo'

  return (
    <>
      {/* ═══════════════════════════ HERO ════════════════════════════ */}
      <section className="relative flex min-h-[55svh] flex-col justify-end overflow-hidden">
        <Image
          src="/images/contact/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-10 md:px-6 md:pb-14">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent-violet">
            <Headset className="size-4" aria-hidden />
            Une équipe à ton écoute
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-text-primary drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] md:text-6xl">
            On te répond
          </h1>
          <p className="mt-4 max-w-xl text-sm text-text-secondary md:text-base">
            {
              "Une question, une inscription ou un partenariat ? Le moyen le plus rapide de nous joindre, c'est WhatsApp."
            }
          </p>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-success-neon px-6 font-bold text-background transition-transform active:scale-[0.98]"
            >
              <FaWhatsapp className="size-5" aria-hidden />
              Discuter sur WhatsApp
            </a>
          )}
        </div>
      </section>

      <div className="mx-auto flex max-w-4xl flex-col gap-14 px-4 py-14 md:gap-20 md:px-6 md:py-20">
        {/* ═══════════════════ NOUS JOINDRE ════════════════════════════ */}
        <section className="grid items-center gap-8 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:order-1">
            <Image
              src="/images/contact/phone.webp"
              alt=""
              fill
              sizes="(min-width: 768px) 28rem, 100vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent"
              aria-hidden
            />
          </div>

          <div className="flex flex-col gap-5 md:order-2">
            <header>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
                Nous joindre
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-text-primary md:text-3xl">
                Écris ou appelle
              </h2>
            </header>

            {hasContactMethod ? (
              <ul className="flex flex-col gap-2">
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
                        className="flex min-h-14 items-center gap-3 rounded-xl bg-surface-1 px-4 text-text-primary transition-colors active:bg-surface-2"
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
                      className="flex min-h-14 items-center gap-3 rounded-xl bg-surface-1 px-4 text-text-primary transition-colors active:bg-surface-2"
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
              </ul>
            ) : (
              <p className="rounded-2xl bg-surface-1 p-5 text-sm text-text-secondary">
                {
                  "Retrouve-nous sur nos réseaux sociaux ci-dessous : c'est là que toute l'actualité des tournois est annoncée."
                }
              </p>
            )}
          </div>
        </section>

        {/* ═══════════════════ NOUS TROUVER ════════════════════════════ */}
        <section className="grid items-center gap-8 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:order-2">
            <Image
              src="/images/contact/localisation.webp"
              alt=""
              fill
              sizes="(min-width: 768px) 28rem, 100vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent"
              aria-hidden
            />
          </div>

          <div className="flex flex-col gap-5 md:order-1">
            <header>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
                Nous trouver
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-text-primary md:text-3xl">
                Sur place, à Pointe-Noire
              </h2>
            </header>
            <div className="flex items-start gap-3 rounded-2xl bg-surface-1 p-5">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                <MapPin className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {locationLine}
                </p>
                {location?.maps_url && (
                  <a
                    href={location.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-violet"
                  >
                    Ouvrir dans Google Maps
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              {
                "Le lieu exact de chaque tournoi est communiqué aux joueurs inscrits avant l'événement."
              }
            </p>
          </div>
        </section>

        {/* ═══════════════════ SUIVEZ-NOUS ═════════════════════════════ */}
        {socials.length > 0 && (
          <section>
            <header className="mb-5 flex items-center gap-2">
              <Share2 className="size-5 text-accent-violet" aria-hidden />
              <h2 className="text-2xl font-black uppercase tracking-tight text-text-primary md:text-3xl">
                Suivez-nous
              </h2>
            </header>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {socials.map(({ key, href, label, icon: Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-surface-1 px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-2 active:scale-[0.98]"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      {label}
                    </span>
                    <ExternalLink className="size-4 text-text-muted" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ═══════════════════ ASSISTANCE IMMÉDIATE ════════════════════ */}
        {(callPhone || waHref) && (
          <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-accent-violet/15 to-surface-1 p-8 shadow-glow-violet md:p-10">
            <div className="flex items-center gap-2 text-accent-violet">
              <TriangleAlert className="size-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Assistance immédiate
              </span>
            </div>
            <h2 className="mt-3 text-xl font-black text-text-primary md:text-2xl">
              {"Besoin d'aide le jour du tournoi ?"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-text-secondary">
              {"Support prioritaire pour les joueurs en lice pendant un événement."}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {callPhone && (
                <a
                  href={`tel:${callPhone.number}`}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-surface-2 px-4 font-semibold text-text-primary transition-transform active:scale-[0.98]"
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
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-success-neon px-4 font-bold text-background transition-transform active:scale-[0.98]"
                >
                  <FaWhatsapp className="size-4" aria-hidden />
                  WhatsApp
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  )
}