import {
  Ban,
  Clock,
  CalendarClock,
  ChevronDown,
  Crown,
  Gauge,
  Hand,
  ShieldAlert,
  Swords,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { formatFCFA } from '@/lib/format/fcfa'

import type { PublicTournamentConfig } from './config'

type TournamentType = 'off_season' | 'season' | 'grand_final'

// ─── Conteneur de section image + contenu (alterné) ───────────────────────
function MediaSection({
  id,
  image,
  eyebrow,
  title,
  reverse = false,
  children,
}: {
  id: string
  image: string
  eyebrow: string
  title: string
  reverse?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div
          className={cn(
            'relative aspect-[4/3] overflow-hidden rounded-2xl md:aspect-square',
            reverse ? 'md:order-2' : 'md:order-1',
          )}
        >
          <Image
            src={image}
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

        <div
          className={cn(
            'flex flex-col gap-5',
            reverse ? 'md:order-1' : 'md:order-2',
          )}
        >
          <header>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-violet">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-text-primary md:text-3xl">
              {title}
            </h2>
          </header>
          {children}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════ FORMAT ═══════════════════════════════════════
const RANKS = ['Bronze', 'Argent', 'Or', 'Diamant', 'Légende'] as const

export function FormatSection({
  tournamentType,
  game,
  match,
}: {
  tournamentType: TournamentType
  game: PublicTournamentConfig['game']
  match: PublicTournamentConfig['match']
}) {
  const facts: Array<{ icon: LucideIcon; text: string }> = []
  if (match) {
    facts.push({ icon: Timer, text: `${match.half_minutes} min / mi-temps` })
    facts.push({ icon: Clock, text: `${match.duration_minutes} min / match` })
  }
  if (game) facts.push({ icon: Gauge, text: `niveau · ${game.difficulty}` })

  return (
    <MediaSection
      id="format"
      image="/images/tournoi/bracket.webp"
      eyebrow="Le format"
      title="Élimination directe"
    >
      <p className="text-sm leading-relaxed text-text-secondary md:text-base">
        {
          "Chaque match est décisif : une seule défaite et l'aventure s'arrête. Affrontements en 1 contre 1, l'équipe est libre avant chaque rencontre. Tiens-toi prêt avant le coup d'envoi."
        }
      </p>

      {facts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {facts.map((f) => (
            <div
              key={f.text}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-1 p-4 text-center"
            >
              <f.icon className="size-7 text-accent-violet" aria-hidden />
              <span className="font-mono text-xs font-medium uppercase tracking-wide text-text-primary">
                {f.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {tournamentType === 'off_season' && (
        <div className="rounded-2xl bg-surface-1 p-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            {
              "Tournoi découverte ouvert à tous, avec cash prize direct. Il n'attribue aucun point de ligue et n'a aucun impact sur le classement de Saison."
            }
          </p>
        </div>
      )}

      {tournamentType === 'season' && (
        <div className="flex flex-col gap-4 rounded-2xl bg-surface-1 p-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            {
              "Tournoi de Saison : ton parcours te rapporte des points de ligue. Plus tu avances, plus tu engranges de points pour grimper les rangs et viser la qualification à la Grande Finale."
            }
          </p>
          <ul className="flex flex-wrap gap-2">
            {RANKS.map((rank) => (
              <li
                key={rank}
                className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-primary"
              >
                {rank}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tournamentType === 'grand_final' && (
        <div className="flex items-start gap-3 rounded-2xl bg-surface-1 p-5">
          <Crown className="size-6 shrink-0 text-warning" aria-hidden />
          <p className="text-sm leading-relaxed text-text-secondary">
            {
              "L'aboutissement de la saison. Seuls les meilleurs joueurs qualifiés au classement s'affrontent pour le titre, dans l'événement premium de la ligue."
            }
          </p>
        </div>
      )}
    </MediaSection>
  )
}

// ═══════════════════════════ PROGRAMME ════════════════════════════════════
export function ScheduleSection({
  schedule,
}: {
  schedule: PublicTournamentConfig['schedule']
}) {
  const slots = schedule
    ? [
        { label: 'Samedi — Accueil & vérification des badges', value: schedule.saturday_arrival },
        { label: 'Samedi — Briefing général', value: schedule.saturday_briefing },
        { label: 'Dimanche — Accueil des qualifiés', value: schedule.sunday_arrival },
        { label: 'Dimanche — Cérémonie & remise des prix', value: schedule.ceremony_time },
      ].filter((s) => Boolean(s.value))
    : []

  return (
    <MediaSection
      id="programme"
      image="/images/tournoi/calendrier.webp"
      eyebrow="Le programme"
      title="Un week-end, deux jours"
      reverse
    >
      <p className="text-sm leading-relaxed text-text-secondary md:text-base">
        {
          "Le tournoi se joue sur deux jours consécutifs, et se conclut le dimanche soir par la cérémonie de remise des prix."
        }
      </p>

      {slots.length === 0 ? (
        <p className="rounded-2xl bg-surface-1 p-5 text-sm text-text-secondary">
          Le programme détaillé sera communiqué prochainement.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => (
            <li
              key={slot.label}
              className="flex items-center justify-between gap-4 rounded-2xl bg-surface-1 p-4"
            >
              <span className="flex items-center gap-3 text-sm text-text-secondary">
                <CalendarClock className="size-4 shrink-0 text-accent-violet" aria-hidden />
                {slot.label}
              </span>
              <span className="font-mono font-semibold tabular-nums text-text-primary">
                {slot.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </MediaSection>
  )
}

// ═══════════════════════════ RÈGLEMENT ════════════════════════════════════
export function RulesSection({
  rules,
}: {
  rules: PublicTournamentConfig['rules']
}) {
  const configRules = rules
    ? [
        {
          icon: Clock,
          title: 'Retard',
          text: `Au-delà de ${rules.late_minutes} minutes de retard, le joueur est déclaré forfait.`,
        },
        {
          icon: ShieldAlert,
          title: 'Réclamation',
          text: `Toute réclamation se dépose dans les ${rules.claim_minutes} minutes suivant le match.`,
        },
        {
          icon: Ban,
          title: 'Sanction',
          text: `Une exclusion entraîne une suspension de ${rules.ban_tournaments} tournoi(s).`,
        },
      ]
    : []

  const eventRules = [
    {
      icon: Hand,
      title: 'Manettes officielles',
      text: 'Seules les manettes du tournoi sont autorisées. Les manettes personnelles sont interdites.',
    },
    {
      icon: Swords,
      title: 'Abandon & fair-play',
      text: "Un abandon équivaut à une défaite. Tout irrespect ou tentative de manipulation entraîne la disqualification.",
    },
  ]

  const items = [...configRules, ...eventRules]

  return (
    <MediaSection
      id="reglement"
      image="/images/tournoi/regles.webp"
      eyebrow="Le règlement"
      title="Les règles du jeu"
    >
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.title} className="rounded-2xl bg-surface-1 p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-violet">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">{item.text}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </MediaSection>
  )
}

// ═══════════════════════════ FAQ ══════════════════════════════════════════
export function FaqSection({
  tournamentType,
  registration,
}: {
  tournamentType: TournamentType
  registration: PublicTournamentConfig['registration']
}) {
  const amountLabel =
    registration?.amount_fcfa !== undefined
      ? formatFCFA(registration.amount_fcfa)
      : null

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: 'Comment se déroule le paiement de l\u2019inscription ?',
      a: amountLabel
        ? `Le montant d\u2019inscription est de ${amountLabel}, réglable via Mobile Money (MTN), Airtel Money ou en espèces. Le paiement constitue un engagement définitif : aucun remboursement n\u2019est possible.`
        : 'Le paiement se fait via Mobile Money (MTN), Airtel Money ou en espèces. Il constitue un engagement définitif : aucun remboursement n\u2019est possible.',
    },
    {
      q: 'Quelle est la différence entre Hors Saison et Saison ?',
      a: 'Un tournoi Hors Saison est un événement découverte avec cash prize direct, sans point de ligue ni impact sur le classement. Un tournoi de Saison attribue des points qui comptent pour la qualification à la Grande Finale.',
    },
    {
      q: 'Quel matériel est utilisé ?',
      a: 'Les matchs se jouent sur les consoles et manettes officielles fournies sur place. Les manettes personnelles ne sont pas autorisées.',
    },
    {
      q: 'Quel comportement est attendu des joueurs ?',
      a: 'Fair-play en toutes circonstances et respect du staff et des autres joueurs. Tout manquement peut entraîner une sanction pouvant aller jusqu\u2019à l\u2019exclusion.',
    },
  ]

  if (tournamentType === 'off_season') {
    faqs.splice(2, 0, {
      q: 'Ce tournoi compte-t-il pour le classement ?',
      a: 'Non. Ce tournoi est Hors Saison : il ne distribue aucun point de ligue et n\u2019affecte pas le classement de Saison.',
    })
  }

  return (
    <MediaSection
      id="faq"
      image="/images/tournoi/faq.webp"
      eyebrow="Questions fréquentes"
      title="Tout ce qu'il faut savoir"
      reverse
    >
      <ul className="flex flex-col gap-2">
        {faqs.map((faq) => (
          <li key={faq.q}>
            <details className="group rounded-2xl bg-surface-1 p-5 [&_summary]:list-none">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-text-primary">
                {faq.q}
                <ChevronDown
                  className="size-4 shrink-0 text-text-secondary transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {faq.a}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </MediaSection>
  )
}