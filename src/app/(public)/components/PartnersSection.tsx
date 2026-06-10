/**
 * Section "Nos partenaires" — page d'accueil (Server Component).
 *
 * Objectif : inspirer la confiance d'un public méfiant en montrant clairement
 * les partenaires réels, leur logo et leur rôle, classés par secteur.
 *
 * - Niveau "Diamant" mis en avant (MTN MoMo + Airtel Money) façon maquette.
 * - Catégories sectorielles avec logos réels (public/images/partenaires/).
 * - Illustration d'intro (public/images/partenaire_section.png).
 * - No-Line (tons de surface), icônes Lucide, aucun emoji. Mobile-first.
 *
 * Données partenaires = statiques (fichiers dans public/, hors DB) — éditer ici.
 */
import {
  ArrowRight,
  Gamepad2,
  Gem,
  Handshake,
  Landmark,
  Plane,
  Wifi,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { ROUTES } from '@/config/routes'

const LOGO_BASE = '/images/partenaires'

// Niveau Diamant — partenaires de paiement (texte repris de la maquette).
const DIAMOND_PARTNERS = [
  {
    src: `${LOGO_BASE}/logo-mtn.png`,
    name: 'MTN MoMo',
    tag: 'Paiement sécurisé',
    description:
      "Facilitateur officiel des transactions et du cash-prize. Avec MTN Mobile Money, l'inscription et la réception des récompenses se font en un clin d'œil, en toute sécurité.",
  },
  {
    src: `${LOGO_BASE}/logo-airtel.png`,
    name: 'Airtel Money',
    tag: 'Inclusion numérique',
    description:
      "Partenaire stratégique pour l'accessibilité. Airtel Money permet à chaque talent de Pointe-Noire et au-delà de rejoindre la compétition, sans barrière bancaire.",
  },
] as const

// Catégories sectorielles — logos réels présents dans public/images/partenaires/.
const CATEGORIES: Array<{
  label: string
  purpose: string
  icon: LucideIcon
  logos: Array<{ src: string; alt: string }>
}> = [
  {
    label: 'Banque & Finance',
    purpose: 'La solidité financière et la confiance de la ligue.',
    icon: Landmark,
    logos: [
      { src: `${LOGO_BASE}/ecobank.png`, alt: 'Ecobank' },
      { src: `${LOGO_BASE}/mucodec.png`, alt: 'MUCODEC' },
      { src: `${LOGO_BASE}/united-bank.png`, alt: 'United Bank for Africa' },
    ],
  },
  {
    label: 'Énergie & Industrie',
    purpose: 'Les grands acteurs qui soutiennent le projet.',
    icon: Zap,
    logos: [
      { src: `${LOGO_BASE}/total-energies.png`, alt: 'TotalEnergies' },
      { src: `${LOGO_BASE}/perenco.png`, alt: 'Perenco' },
      { src: `${LOGO_BASE}/snpc.png`, alt: 'SNPC' },
    ],
  },
  {
    label: 'Télécom & Internet',
    purpose: 'La connectivité qui fait vivre la compétition en ligne.',
    icon: Wifi,
    logos: [
      { src: `${LOGO_BASE}/its-congo.png`, alt: 'ITS Congo' },
      { src: `${LOGO_BASE}/global-broadband-solution.png`, alt: 'Global Broadband Solution' },
      { src: `${LOGO_BASE}/super-sonic.png`, alt: 'Super Sonic' },
    ],
  },
  {
    label: 'Gaming & Équipement',
    purpose: "Le matériel et l'univers du jeu.",
    icon: Gamepad2,
    logos: [
      { src: `${LOGO_BASE}/game-store.png`, alt: 'Game Store' },
      { src: `${LOGO_BASE}/burotec.png`, alt: 'Burotec' },
    ],
  },
  {
    label: 'Transport',
    purpose: 'La mobilité des équipes et des talents.',
    icon: Plane,
    logos: [{ src: `${LOGO_BASE}/trans-air-congo.png`, alt: 'Trans Air Congo' }],
  },
]

function LogoTile({ src, alt }: { src: string; alt: string }) {
  return (
    <li className="relative flex h-16 items-center justify-center rounded-lg bg-white px-4 py-3">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="160px"
        className="object-contain p-3"
      />
    </li>
  )
}

export function PartnersSection() {
  return (
    <section
      aria-labelledby="partenaires-title"
      className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20"
    >
      {/* En-tête */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-violet">
          Écosystème esport
        </span>
        <h2
          id="partenaires-title"
          className="text-3xl font-black tracking-tight text-text-primary md:text-4xl"
        >
          Nos partenaires
        </h2>
        <p className="max-w-xl text-sm text-text-secondary md:text-base">
          {
            "Ils font confiance à THE PLAYERS et soutiennent l'esport au Congo. Des acteurs reconnus, à vos côtés à chaque compétition."
          }
        </p>
      </div>

      {/* Illustration d'intro */}
      <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-surface-1 sm:aspect-[2/1] lg:aspect-[5/2]">
        <Image
          src="/images/partenaire_section.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"
          aria-hidden
        />
      </div>

      {/* Niveau Diamant */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {DIAMOND_PARTNERS.map((partner) => (
          <article
            key={partner.name}
            className="flex flex-col gap-4 rounded-2xl bg-surface-1 p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="relative h-12 w-28 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image
                  src={partner.src}
                  alt={partner.name}
                  fill
                  sizes="112px"
                  className="object-contain p-2"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-success-neon">
                <Gem className="size-3.5" aria-hidden />
                Partenaire Diamant
              </span>
            </div>
            <h3 className="text-lg font-bold text-text-primary">
              {partner.name}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {partner.description}
            </p>
            <p className="mt-auto inline-flex items-center gap-3 pt-2 text-xs font-semibold uppercase tracking-widest text-text-primary">
              <span className="h-px w-6 bg-accent-violet" aria-hidden />
              {partner.tag}
            </p>
          </article>
        ))}
      </div>

      {/* Catégories sectorielles */}
      <div className="mt-10 flex flex-col gap-8">
        {CATEGORIES.map(({ label, purpose, icon: Icon, logos }) => (
          <div key={label}>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                  {label}
                </h3>
                <p className="text-xs text-text-secondary">{purpose}</p>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {logos.map((logo) => (
                <LogoTile key={logo.src} src={logo.src} alt={logo.alt} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA : devenir partenaire */}
      <div className="mt-12 overflow-hidden rounded-2xl bg-surface-1 p-8 text-center md:p-10">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent-violet/15 text-accent-violet">
          <Handshake className="size-6" aria-hidden />
        </span>
        <h3 className="mt-4 text-2xl font-black text-text-primary md:text-3xl">
          Propulsez votre marque
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
          {
            "Rejoignez l'élite de l'esport au Congo. Devenez partenaire de la Liga Esport FC et touchez une audience jeune, engagée et technophile."
          }
        </p>
        <Link
          href={ROUTES.contact}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-br from-accent-violet to-accent-violet-dim px-8 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98]"
        >
          Nous rejoindre
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}