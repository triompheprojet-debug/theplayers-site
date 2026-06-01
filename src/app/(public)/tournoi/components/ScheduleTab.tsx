import { CalendarClock } from 'lucide-react'

import type { PublicTournamentConfig } from './config'

interface ScheduleTabProps {
  schedule: PublicTournamentConfig['schedule']
}

/**
 * Onglet Programme : horaires du week-end (samedi / dimanche / cérémonie).
 * Valeurs issues de tournaments.config. Server Component.
 */
export function ScheduleTab({ schedule }: ScheduleTabProps) {
  if (!schedule) {
    return (
      <p className="rounded-2xl bg-surface-1 p-6 text-sm text-text-secondary">
        Le programme sera communiqué prochainement.
      </p>
    )
  }

  const slots = [
    { label: 'Samedi — Arrivée', value: schedule.saturday_arrival },
    { label: 'Samedi — Briefing', value: schedule.saturday_briefing },
    { label: 'Dimanche — Arrivée', value: schedule.sunday_arrival },
    { label: 'Cérémonie de clôture', value: schedule.ceremony_time },
  ].filter((s) => Boolean(s.value))

  return (
    <ul className="space-y-2">
      {slots.map((slot) => (
        <li
          key={slot.label}
          className="flex items-center justify-between gap-4 rounded-2xl bg-surface-1 p-5"
        >
          <span className="flex items-center gap-3 text-sm text-text-secondary">
            <CalendarClock className="size-4 shrink-0" aria-hidden />
            {slot.label}
          </span>
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {slot.value}
          </span>
        </li>
      ))}
    </ul>
  )
}