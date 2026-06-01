/**
 * Footer public (M05).
 *
 * Server Component présentationnel : reçoit les réseaux sociaux en props
 * (issus de app_config.social_links côté layout) pour respecter la Règle 11
 * (zéro hardcode) sans dépendre du contrat exact de getAppConfig ici.
 *
 * - Structure documentée : { facebook, instagram, tiktok, whatsapp_public }
 * - N'affiche que les liens réellement renseignés.
 * - No-Line (séparation par tons), aucun emoji.
 * - Icônes de marque via react-icons/fa6 (lucide-react n'a pas Facebook /
 *   Instagram / TikTok / WhatsApp).
 */
import Link from 'next/link'
import type { IconType } from 'react-icons'
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa6'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { ROUTES } from '@/config/routes'

export interface PublicSocialLinks {
  facebook?: string | null
  instagram?: string | null
  tiktok?: string | null
  whatsapp_public?: string | null
}

interface PublicFooterProps {
  socialLinks?: PublicSocialLinks | null
}

const FOOTER_LINKS = [
  { href: ROUTES.tournament, label: 'Tournoi' },
  { href: ROUTES.ranking, label: 'Classement' },
  { href: ROUTES.eventTypes, label: 'Types d\u2019\u00e9v\u00e9nements' },
  { href: ROUTES.contact, label: 'Contact' },
]

export function PublicFooter({ socialLinks }: PublicFooterProps) {
  const socials: Array<{ key: string; href: string; label: string; icon: IconType }> = []

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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="flex flex-col gap-3">
          <BrandLogo variant="default" withText />
          <p className="max-w-xs text-sm text-text-secondary">
            Tournois esport EA Sports FC à Pointe-Noire.
          </p>
        </div>

        <nav aria-label="Liens de pied de page">
          <ul className="flex flex-col gap-1">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-11 items-center text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {socials.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-text-secondary">
              Suivez-nous
            </span>
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
          </div>
        )}
      </div>

      <div className="bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <p className="text-xs text-text-secondary">
            &copy; {year} THE PLAYERS — Liga Esport FC. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}