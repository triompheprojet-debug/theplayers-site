import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Gamepad2,
  MapPin,
  Medal,
  Trophy,
  UserPlus,
  Wallet,
} from 'lucide-react'
import Image, { getImageProps } from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { AmbientVideo } from '@/components/shared/AmbientVideo'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { FCFA } from '@/components/shared/FCFA'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { getAppConfig } from '@/lib/config/app-config'
import { getActiveTournamentPublic } from '@/lib/tournaments/active'

import { PartnersSection } from './components/PartnersSection'
import { readPublicConfig } from './tournoi/components/config'

import type { PublicTournamentConfig } from './tournoi/components/config'

export const revalidate = 60

// ─── Assets de la page (public/) ──────────────────────────────────────────
const IMG = {
  heroMobile: '/images/accueil/hero_section_mobile.webp',
  heroDesktop: '/images/accueil/hero_section_desktop.webp',
  background: '/images/accueil/background.webp',
  cashPrize: '/images/accueil/cash_prize_3d.webp',
  howTo: '/images/accueil/inscription_3d.webp',
  trophy: '/images/accueil/trophee_3d.webp',
} as const

const VIDEO = {
  duel: '/animation/dual-intensite.mp4',
} as const

export async function generateMetadata(): Promise<Metadata> {
  const active = await getActiveTournamentPublic()
  return {
    title: active
      ? `${active.name} — THE PLAYERS`
      : 'THE PLAYERS — Liga Esport FC',
    description:
      'Tournois esport EA Sports FC à Pointe-Noire. Inscriptions, classement et brackets en ligne.',
  }
}

// ─── Fond hero : art direction mobile/desktop sans double téléchargement ──
function HeroBackground() {
  const common = {
    alt: '',
    sizes: '100vw',
    fill: true,
    priority: true,
    className: 'object-cover object-center',
  } as const

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: IMG.heroDesktop })
  const {
    props: { srcSet: mobileSrcSet, ...rest },
  } = getImageProps({ ...common, src: IMG.heroMobile })

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
      <source srcSet={mobileSrcSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" dans rest (décoratif) */}
      <img {...rest} />
    </picture>
  )
}

// ─── Image « objet flottant » (effet 3D sans 3D) ──────────────────────────
// Le sujet est généré sur fond #0a0a14 ; le masque radial fond les bords
// dans la page, le drop-shadow violet donne la profondeur, le halo au sol
// ancre l'objet. Aucun cadre, aucune carte : l'objet flotte sur la page.
function FloatingImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string
  alt: string
  sizes: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {/* Halo au sol */}
      <div
        aria-hidden
        className="absolute inset-x-[18%] bottom-[4%] h-12 rounded-[100%] bg-accent-violet/25 blur-2xl"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-contain drop-shadow-[0_0_45px_rgba(139,92,246,0.35)] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_60%,transparent_98%)] transition-transform duration-slow ease-out md:hover:scale-[1.03]"
      />
    </div>
  )
}

// ─── En-tête de section (eyebrow + titre) ─────────────────────────────────
function SectionHeading({
  eyebrow,
  title,
  align = 'center',
}: {
  eyebrow: string
  title: string
  align?: 'center' | 'left'
}) {
  return (
    <header className={align === 'center' ? 'text-center' : 'text-left'}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-text-primary md:text-4xl">
        {title}
      </h2>
    </header>
  )
}

// ─── Étapes « Comment participer » (contenu éditorial, pas de métier) ─────
const STEPS = [
  {
    icon: UserPlus,
    title: 'Crée ton compte',
    text: 'Choisis ton pseudo de joueur — il devient ton identité officielle sur tout le circuit.',
  },
  {
    icon: CalendarCheck,
    title: 'Réserve ta place',
    text: 'Connecte-toi à ton espace joueur et réserve ta place pour le tournoi en cours, en un clic.',
  },
  {
    icon: Wallet,
    title: 'Paie et reçois ton badge',
    text: 'Règle ton inscription via Mobile Money (MTN), Airtel Money ou Espèces. Après validation, ton badge officiel avec QR code est généré.',
  },
] as const

export default async function HomePage() {
  const active = await getActiveTournamentPublic()

  // ─── Aucun tournoi actif : message configurable, ambiance conservée ─────
  if (!active) {
    const siteMessage = await getAppConfig('site_message')
    return (
      <>
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center md:px-6">
          <Image
            src={IMG.background}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"
            aria-hidden
          />
          <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-surface-1 text-text-secondary">
              <Trophy className="size-8" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-text-primary md:text-4xl">
              Aucun tournoi en cours
            </h1>
            <p className="max-w-md text-base text-text-secondary">
              {siteMessage ??
                'Le prochain tournoi sera annoncé prochainement. Revenez bientôt.'}
            </p>
            <Link
              href={ROUTES.eventTypes}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-surface-2 px-6 font-semibold text-text-primary transition-colors hover:bg-surface-3 active:scale-[0.98]"
            >
              Découvrir nos événements
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
        <PartnersSection />
      </>
    )
  }

  const config: PublicTournamentConfig = readPublicConfig(active)
  const gameName = config.game?.name
  const platform = config.game?.platform
  const firstPrize = config.prizes?.first_fcfa
  const secondPrize = config.prizes?.second_fcfa
  const entryFee = config.registration?.amount_fcfa
  const location = config.location

  return (
    <>
      {/* ════════════════════════ HERO plein écran ═══════════════════════ */}
      <section className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center md:px-6">
        <HeroBackground />

        {/* Voiles de lisibilité */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
          aria-hidden
        />

        {/* Contenu */}
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-7">
          {active.is_registrations_open && (
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-1/90 px-4 py-2">
              <span className="relative flex size-2">
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full bg-success-neon opacity-75"
                  aria-hidden
                />
                <span className="relative inline-flex size-2 rounded-full bg-success-neon" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-success-neon">
                Inscriptions ouvertes
              </span>
            </span>
          )}

          <div className="flex flex-col items-center gap-3">
            <h1 className="text-5xl font-black tracking-tight drop-shadow-[0_0_25px_rgba(139,92,246,0.45)] md:text-7xl">
              <span className="text-accent-violet">THE</span>{' '}
              <span className="text-text-primary">PLAYERS</span>
            </h1>
            <p className="text-xl font-bold text-text-primary md:text-3xl">
              {active.name}
            </p>
            {gameName && (
              <p className="inline-flex items-center gap-2 rounded-full bg-surface-1/90 px-4 py-2 text-sm font-semibold text-accent-violet">
                <Gamepad2 className="size-4" aria-hidden />
                {gameName}
                {platform && (
                  <span className="text-text-secondary">· {platform}</span>
                )}
              </p>
            )}
          </div>

          <div className="mt-2 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {active.is_registrations_open && (
              <Link
                href={ROUTES.signUp}
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-md bg-gradient-to-br from-accent-violet to-accent-violet-dim px-8 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98] sm:w-auto"
              >
                {"S'inscrire en ligne"}
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            )}
            <Link
              href={ROUTES.tournament}
              className="inline-flex min-h-[56px] w-full items-center justify-center rounded-md bg-surface-2/90 px-8 font-semibold text-text-primary transition-colors hover:bg-surface-3 active:scale-[0.98] sm:w-auto"
            >
              {"Découvrir l'événement"}
            </Link>
          </div>
        </div>

        {/* Indice de scroll */}
        <ChevronDown
          className="absolute bottom-5 z-10 size-6 animate-bounce text-text-muted"
          aria-hidden
        />
      </section>

      {/* ════════════════════════ COMPTE À REBOURS ═══════════════════════ */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Halo violet CSS pur (aucune vidéo) */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-violet/15 blur-[120px]"
        />
        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-8 px-4 md:px-6">
          <SectionHeading eyebrow="Compte à rebours" title="Le coup d'envoi" />
          <CountdownTimer
            variant="boxes"
            targetDate={active.start_date}
            className="w-full"
          />
        </div>
      </section>

      {/* ═══════ Zone centrale sur texture ambiante (background.webp) ════ */}
      <div className="relative">
        <Image
          src={IMG.background}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-20"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background via-background/30 to-background"
          aria-hidden
        />

        <div className="relative">
          {/* ════════════════════ CASH PRIZE ═════════════════════════════ */}
          {(firstPrize !== undefined || secondPrize !== undefined) && (
            <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
              <FloatingImage
                src={IMG.cashPrize}
                alt="Cash prize en francs CFA et manette de jeu"
                sizes="(min-width: 768px) 50vw, 100vw"
                className="aspect-square"
              />

              <div className="flex flex-col gap-8">
                <SectionHeading
                  eyebrow="Récompenses"
                  title="Joue. Gagne. Encaisse."
                  align="left"
                />
                <div className="flex flex-col gap-4">
                  {firstPrize !== undefined && (
                    <div className="flex items-center gap-4 rounded-2xl bg-surface-1/90 p-5">
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-success-neon/10 text-success-neon">
                        <Trophy className="size-6" aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-text-secondary">
                          1<sup>er</sup> prix
                        </p>
                        <FCFA amount={firstPrize} large neon />
                      </div>
                    </div>
                  )}
                  {secondPrize !== undefined && (
                    <div className="flex items-center gap-4 rounded-2xl bg-surface-1/90 p-5">
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet">
                        <Medal className="size-6" aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-text-secondary">
                          2<sup>e</sup> prix
                        </p>
                        <FCFA
                          amount={secondPrize}
                          className="text-xl font-bold text-text-primary md:text-2xl"
                        />
                      </div>
                    </div>
                  )}
                  {entryFee !== undefined && (
                    <p className="text-sm text-text-secondary">
                      {"Frais d'inscription : "}
                      <FCFA
                        amount={entryFee}
                        className="font-semibold text-text-primary"
                      />
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ════════════════ COMMENT PARTICIPER ═════════════════════════ */}
          <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
            <div className="flex flex-col gap-8">
              <SectionHeading
                eyebrow="Comment participer"
                title="Trois étapes, une place"
                align="left"
              />
              <ol className="flex flex-col gap-4">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex items-start gap-4 rounded-2xl bg-surface-1/90 p-5"
                  >
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet">
                      <step.icon className="size-6" aria-hidden />
                    </span>
                    <div>
                      <p className="font-mono text-xs font-bold text-accent-violet">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-0.5 font-bold text-text-primary">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {active.is_registrations_open && (
                <Link
                  href={ROUTES.signUp}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-gradient-to-br from-accent-violet to-accent-violet-dim px-6 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98] sm:w-auto sm:self-start"
                >
                  Commencer maintenant
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </div>

            <FloatingImage
              src={IMG.howTo}
              alt="Création de compte joueur sur smartphone"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="order-first aspect-[3/4] md:order-last"
            />
          </section>
        </div>
      </div>

      {/* ════════════════════ IMMERSION / JOUR J ═════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <AmbientVideo src={VIDEO.duel} className="opacity-60" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center md:px-6">
          <SectionHeading eyebrow="Jour J" title="Vis l'intensité du direct" />
          <p className="max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
            {
              "Face à face, manette en main, sous les projecteurs. Chaque match se joue sur place, en public, dans une ambiance d'arène."
            }
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {location?.address && (
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-1/90 px-4 py-2 text-sm font-semibold text-text-primary">
                <MapPin className="size-4 text-accent-violet" aria-hidden />
                {location.address}
                {location.city && (
                  <span className="text-text-secondary">
                    · {location.city}
                  </span>
                )}
              </span>
            )}
            {platform && (
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-1/90 px-4 py-2 text-sm font-semibold text-text-primary">
                <Gamepad2 className="size-4 text-accent-violet" aria-hidden />
                {platform}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════ TROPHÉE / APPEL FINAL ══════════════════════ */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
        <FloatingImage
          src={IMG.trophy}
          alt="Trophée du tournoi THE PLAYERS"
          sizes="(min-width: 768px) 40vw, 100vw"
          className="mx-auto aspect-[4/5] w-full max-w-sm"
        />

        <div className="flex flex-col gap-6 text-center md:text-left">
          <SectionHeading
            eyebrow="La consécration"
            title="Un seul nom au sommet"
            align="left"
          />
          <p className="text-sm leading-relaxed text-text-secondary md:text-base">
            {
              "Hors Saison, Saison régulière, Grande Finale : le circuit Liga Esport FC récompense la régularité et le talent. Découvre les formats et trace ta route vers le titre."
            }
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row md:items-start">
            <Link
              href={ROUTES.eventTypes}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-surface-2 px-6 font-semibold text-text-primary transition-colors hover:bg-surface-3 active:scale-[0.98] sm:w-auto"
            >
              Découvrir le circuit
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            {active.is_registrations_open && (
              <Link
                href={ROUTES.signUp}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-gradient-to-br from-accent-violet to-accent-violet-dim px-6 font-bold text-text-on-accent shadow-glow-violet transition-transform active:scale-[0.98] sm:w-auto"
              >
                {"S'inscrire en ligne"}
              </Link>
            )}
          </div>
        </div>
      </section>

      <PartnersSection />
    </>
  )
}