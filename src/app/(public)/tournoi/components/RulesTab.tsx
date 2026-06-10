import { Ban, Clock, ShieldAlert } from 'lucide-react'

import type { PublicTournamentConfig } from './config'

interface RulesTabProps {
  rules: PublicTournamentConfig['rules']
}

export function RulesTab({ rules }: RulesTabProps) {
  const items = rules
    ? [
        {
          icon: Clock,
          title: 'Retard',
          text: `Un joueur en retard de plus de ${rules.late_minutes} minutes est déclaré forfait.`,
        },
        {
          icon: ShieldAlert,
          title: 'Réclamation',
          text: `Toute réclamation doit être déposée dans les ${rules.claim_minutes} minutes suivant le match.`,
        },
        {
          icon: Ban,
          title: 'Sanction',
          text: `Une exclusion entraîne une suspension de ${rules.ban_tournaments} tournoi(s).`,
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-bold text-accent-violet md:text-3xl">
        Règlement
      </h2>

      {items.length === 0 ? (
        <p className="rounded-2xl bg-surface-1 p-6 text-sm text-text-secondary">
          Le règlement détaillé sera publié prochainement.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.title} className="rounded-2xl bg-surface-1 p-5">
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
      )}
    </div>
  )
}