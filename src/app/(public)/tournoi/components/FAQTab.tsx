import { ChevronDown } from 'lucide-react'

import { formatFCFA } from '@/lib/format/fcfa'

import type { PublicTournamentConfig } from './config'

interface FAQTabProps {
  tournamentType: 'off_season' | 'season' | 'grand_final'
  registration: PublicTournamentConfig['registration']
}

export function FAQTab({ tournamentType, registration }: FAQTabProps) {
  const amountLabel =
    registration?.amount_fcfa !== undefined
      ? formatFCFA(registration.amount_fcfa)
      : null

  const faqs: Array<{ q: string; a: string }> = []

  if (amountLabel) {
    faqs.push({
      q: 'Comment se déroule le paiement de l\u2019inscription ?',
      a: `Le montant d\u2019inscription est de ${amountLabel}. Le paiement constitue un engagement définitif de participation : aucun remboursement n\u2019est possible, quelle qu\u2019en soit la raison.`,
    })
  } else {
    faqs.push({
      q: 'Comment se déroule le paiement de l\u2019inscription ?',
      a: 'Le paiement constitue un engagement définitif de participation : aucun remboursement n\u2019est possible, quelle qu\u2019en soit la raison.',
    })
  }

  faqs.push({
    q: 'Quelle est la différence entre Hors Saison et Saison ?',
    a: 'Un tournoi Hors Saison est un événement découverte ouvert à tous, avec cash prize direct, mais qui n\u2019attribue aucun point de ligue et n\u2019a aucun impact sur le classement de Saison. Un tournoi de Saison attribue des points qui comptent pour la qualification à la Grande Finale.',
  })

  if (tournamentType === 'off_season') {
    faqs.push({
      q: 'Ce tournoi compte-t-il pour le classement ?',
      a: 'Non. Ce tournoi est Hors Saison : il ne distribue aucun point de ligue et n\u2019affecte pas le classement de Saison.',
    })
  }

  faqs.push({
    q: 'Quel comportement est attendu des joueurs ?',
    a: 'Fair-play en toutes circonstances et respect du staff et des autres joueurs. Tout manquement peut entraîner une sanction pouvant aller jusqu\u2019à l\u2019exclusion.',
  })

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-bold text-accent-violet md:text-3xl">
        Questions fréquentes
      </h2>

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
              <p className="mt-3 text-sm text-text-secondary">{faq.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}