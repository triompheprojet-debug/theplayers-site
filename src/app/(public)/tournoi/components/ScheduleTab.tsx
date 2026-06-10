import { CalendarClock } from 'lucide-react'

import type { PublicTournamentConfig } from './config'

interface ScheduleTabProps {
  schedule: PublicTournamentConfig['schedule']
}

export function ScheduleTab({ schedule }: ScheduleTabProps) {
  const slots = schedule
    ? [
        { label: 'Samedi — Arrivée', value: schedule.saturday_arrival },
        { label: 'Samedi — Briefing', value: schedule.saturday_briefing },
        { label: 'Dimanche — Arrivée', value: schedule.sunday_arrival },
        { label: 'Cérémonie de clôture', value: schedule.ceremony_time },
      ].filter((s) => Boolean(s.value))
    : []

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-bold text-accent-violet md:text-3xl">
        Programme
      </h2>

      {slots.length === 0 ? (
        <p className="rounded-2xl bg-surface-1 p-6 text-sm text-text-secondary">
          Le programme sera communiqué prochainement.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
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
      )}
    </div>
  )
}