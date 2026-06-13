/**
 * Section "Nos partenaires" — page d'accueil (Server Component).
 *
 * Objectif : inspirer la confiance d'un public méfiant en montrant clairement
 * les partenaires réels, leur logo et leur rôle, classés par secteur.
 *
 * Disposition :
 *  - En-tête (halo violet CSS + filet décoratif, aucune image).
 *  - Partenaires officiels (MTN MoMo + Airtel Money) — cartes premium.
 *  - Partenaires par secteur — grille de cartes (annuaire).
 *  - CTA "devenir partenaire".
 *
 * Règles : No-Line (tons de surface, pas de bordures CSS), icônes Lucide
 * uniquement, aucun emoji, mobile-first. "Diamant" volontairement absent
 * (réservé à l'éditeur du projet, sans rapport avec l'évènement).
 *
 * Données partenaires = statiques (fichiers dans public/, hors DB) — éditer ici.
 */
import {
  ArrowRight,
  BadgeCheck,
  Gamepad2,
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

// Partenaires officiels — facilitateurs de paiement (texte repris de la maquette).
const OFFICIAL_PARTNERS = [
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
      {
        src: `${LOGO_BASE}/global-broadband-solution.png`,
        alt: 'Global Broadband Solution',
      },
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
    <li className="relative flex h-14 items-center justify-center rounded-lg bg-white px-3">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="160px"
        className="object-contain p-2.5"
      />
    </li>
  )
}

export function PartnersSection() {
  return (
    <section
      aria-labelledby="partenaires-title"
      className="relative overflow-hidden py-16 md:py-20"
    >
      {/* Halo d'ambiance (remplace l'ancienne image, CSS pur) */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 size-[460px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent-violet/10 blur-[130px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        {/* ── En-tête ─────────────────────────────────────────────── */}
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
          {/* Filet décoratif */}
          <span
            aria-hidden
            className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-accent-violet to-success-neon"
          />
        </div>

        {/* ── Partenaires officiels (MTN / Airtel) ────────────────── */}
        <div className="mt-12">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">
            Partenaires officiels
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {OFFICIAL_PARTNERS.map((partner) => (
              <article
                key={partner.name}
                className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-surface-1 p-6"
              >
                {/* Barre d'accent supérieure */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-violet to-accent-violet-dim"
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="relative h-14 w-32 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image
                      src={partner.src}
                      alt={partner.name}
                      fill
                      sizes="128px"
                      className="object-contain p-2.5"
                    />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-violet/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-violet">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    Partenaire officiel
                  </span>
                </div>

                <h4 className="text-lg font-bold text-text-primary">
                  {partner.name}
                </h4>
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
        </div>

        {/* ── Partenaires par secteur (grille de cartes) ──────────── */}
        <div className="mt-12">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-secondary">
            Partenaires par secteur
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map(({ label, purpose, icon: Icon, logos }) => (
              <div
                key={label}
                className="flex flex-col gap-4 rounded-2xl bg-surface-1 p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                      {label}
                    </h4>
                    <p className="mt-0.5 text-xs leading-snug text-text-secondary">
                      {purpose}
                    </p>
                  </div>
                </div>
                <ul className="mt-auto grid grid-cols-2 gap-2">
                  {logos.map((logo) => (
                    <LogoTile key={logo.src} src={logo.src} alt={logo.alt} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA : devenir partenaire ────────────────────────────── */}
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
      </div>
    </section>
  )
}