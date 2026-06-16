'use client'

import { cn } from '@/lib/utils'

import type { Database } from '@/types/database.types'

type MatchStatus = Database['public']['Enums']['match_status']

export interface MatchFilters {
  round: number | 'all'
  status: MatchStatus | 'all'
  console: number | 'all'
  wave: number | 'all'
}

export interface FilterOptions {
  rounds: number[]
  statuses: MatchStatus[]
  consoles: number[]
  waves: number[]
}

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'À venir',
  in_progress: 'En cours',
  completed: 'Terminé',
  forfeit: 'Forfait',
  cancelled: 'Annulé',
}

/**
 * Barre de filtres contrôlée (selects natifs — fiables au pouce sur mobile).
 * Ne propose que les valeurs réellement présentes (dérivées en amont).
 */
export function MatchListFilters({
  options,
  filters,
  onChange,
}: {
  options: FilterOptions
  filters: MatchFilters
  onChange: (f: MatchFilters) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <FilterSelect
        label="Tour"
        value={String(filters.round)}
        onChange={(v) =>
          onChange({ ...filters, round: v === 'all' ? 'all' : Number(v) })
        }
      >
        <option value="all">Tous</option>
        {options.rounds.map((r) => (
          <option key={r} value={r}>
            Tour {r}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Statut"
        value={filters.status}
        onChange={(v) =>
          onChange({
            ...filters,
            status: v === 'all' ? 'all' : (v as MatchStatus),
          })
        }
      >
        <option value="all">Tous</option>
        {options.statuses.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Console"
        value={String(filters.console)}
        onChange={(v) =>
          onChange({ ...filters, console: v === 'all' ? 'all' : Number(v) })
        }
      >
        <option value="all">Toutes</option>
        {options.consoles.map((c) => (
          <option key={c} value={c}>
            Console {c}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Vague"
        value={String(filters.wave)}
        onChange={(v) =>
          onChange({ ...filters, wave: v === 'all' ? 'all' : Number(v) })
        }
      >
        <option value="all">Toutes</option>
        {options.waves.map((w) => (
          <option key={w} value={w}>
            Vague {w}
          </option>
        ))}
      </FilterSelect>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-10 w-full appearance-none rounded-lg bg-surface-1 px-3 text-sm text-text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-referee',
        )}
      >
        {children}
      </select>
    </label>
  )
}