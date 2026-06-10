/**
 * Footer public — Server Component présentationnel.
 *
 * Volontairement SIMPLE et distinctif (≠ footers génériques multi-colonnes) :
 *  - Bande de défilement (marquee CSS pur) expliquant en continu l'événement
 *    et l'utilité du site. Pause au survol/focus, gelée sous prefers-reduced-motion.
 *  - Corps compact : marque + accroche + localisation à gauche, réseaux à droite.
 *  - Réseaux sociaux issus de app_config.social_links (prop, zéro hardcode).
 *  - No-Line (séparation par tons de surface), aucun emoji.
 *  - La section "Nos partenaires" a été DÉPLACÉE sur la page d'accueil.
 *
 * Icônes de marque via react-icons/fa6 (Lucide n'a pas FB/IG/TikTok/WhatsApp).
 */
import { Gamepad2, MapPin } from 'lucide-react'
import type { IconType } from 'react-icons'
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6'

import { BrandLogo } from '@/components/shared/BrandLogo'

export interface PublicSocialLinks {
  facebook?: string | null
  instagram?: string | null
  tiktok?: string | null
  whatsapp_public?: string | null
}

interface PublicFooterProps {
  socialLinks?: PublicSocialLinks | null
}

/**
 * Phrases du bandeau défilant. Texte marketing éditable ici (statique).
 * Pourra être déplacé vers app_config plus tard si besoin d'édition sans code.
 */
const MARQUEE_ITEMS = [
  'THE PLAYERS — la ligue esport EA Sports FC à Pointe-Noire',
  "Inscris-toi en ligne, paie en Mobile Money, reçois ton badge officiel",
  'Suis les brackets et le classement de la saison',
  'Compétition. Performance. Passion.',
]

const MARQUEE_CSS = `
@keyframes tp-footer-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.tp-footer-marquee-track { animation: tp-footer-marquee 30s linear infinite; }
.tp-footer-marquee:hover .tp-footer-marquee-track,
.tp-footer-marquee:focus-within .tp-footer-marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .tp-footer-marquee-track { animation: none; }
}
`

export function PublicFooter({ socialLinks }: PublicFooterProps) {
  const socials: Array<{
    key: string
    href: string
    label: string
    icon: IconType
  }> = []

  if (socialLinks?.facebook) {
    socials.push({ key: 'facebook', href: socialLinks.facebook, label: 'Facebook', icon: FaFacebookF })
  }
  if (socialLinks?.instagram) {
    socials.push({ key: 'instagram', href: socialLinks.instagram, label: 'Instagram', icon: FaInstagram })
  }
  if (socialLinks?.tiktok) {
    socials.push({ key: 'tiktok', href: socialLinks.tiktok, label: 'TikTok', icon: FaTiktok })
  }
  if (socialLinks?.whatsapp_public) {
    socials.push({ key: 'whatsapp', href: socialLinks.whatsapp_public, label: 'WhatsApp', icon: FaWhatsapp })
  }

  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-surface-1">
      {/* Bandeau défilant : explication continue de l'événement et du site */}
      <div className="bg-surface-2">
        <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
        <div className="tp-footer-marquee relative overflow-hidden py-3">
          <div className="tp-footer-marquee-track flex w-max">
            {[0, 1].map((dup) => (
              <ul
                key={dup}
                aria-hidden={dup === 1 || undefined}
                className="flex shrink-0 items-center"
              >
                {MARQUEE_ITEMS.map((item, i) => (
                  <li
                    key={`${dup}-${i}`}
                    className="flex shrink-0 items-center text-xs font-medium uppercase tracking-widest text-text-secondary"
                  >
                    <span>{item}</span>
                    <span className="mx-5 text-accent-violet" aria-hidden>
                      •
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>

      {/* Corps compact */}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2">
            <Gamepad2 className="size-6 text-accent-violet" aria-hidden />
            <BrandLogo variant="default" withText />
          </span>
          <p className="inline-flex items-center gap-2 text-xs text-text-muted">
            <MapPin className="size-4" aria-hidden />
            Pointe-Noire, République du Congo
          </p>
        </div>

        {socials.length > 0 && (
          <ul className="flex items-center gap-2">
            {socials.map(({ key, href, label, icon: Icon }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex size-12 items-center justify-center rounded-md bg-surface-2 text-text-secondary transition-colors hover:text-text-primary"
                >
                  <Icon className="size-5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Copyright */}
      <div className="bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            © {year} THE PLAYERS — Liga Esport FC. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}