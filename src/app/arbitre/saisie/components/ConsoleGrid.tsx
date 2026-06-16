import { cn } from '@/lib/utils'

import type { AdminBracketMatch } from '@/lib/bracket/read'

interface ConsoleGridProps {
  matches: AdminBracketMatch[]
  consoleCount: number
  selectedId: string | null
  onSelect: (matchId: string) => void
}

/**
 * Grille des consoles (jour J) — quelle console joue quel match.
 *
 * Le nombre de consoles vient de `config.consoles.active_count` (Règle 11),
 * passé en prop. Pour chaque console, on affiche le match jouable qui lui est
 * assigné (priorité au match en cours), ou « Libre ». Tap = sélection.
 */
export function ConsoleGrid({
  matches,
  consoleCount,
  selectedId,
  onSelect,
}: ConsoleGridProps) {
  // Indexe les matchs par numéro de console (priorité in_progress).
  const byConsole = new Map<number, AdminBracketMatch>()
  for (const m of matches) {
    if (m.consoleNumber === null) continue
    const current = byConsole.get(m.consoleNumber)
    if (!current || m.status === 'in_progress') {
      byConsole.set(m.consoleNumber, m)
    }
  }

  const consoles = Array.from({ length: consoleCount }, (_, i) => i + 1)

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">
        Consoles
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {consoles.map((num) => {
          const match = byConsole.get(num) ?? null
          const isSelected = match !== null && match.id === selectedId
          const isLive = match?.status === 'in_progress'

          return (
            <li key={num}>
              <button
                type="button"
                disabled={match === null}
                onClick={() => match && onSelect(match.id)}
                aria-pressed={isSelected}
                className={cn(
                  'flex h-full min-h-18 w-full flex-col gap-1 rounded-lg px-3 py-2 text-left',
                  'transition-colors disabled:cursor-default',
                  isSelected
                    ? 'bg-referee/15'
                    : match
                      ? 'bg-surface-1 active:scale-[0.99]'
                      : 'bg-surface-1/50',
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Console {num}
                  </span>
                  {isLive ? (
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full bg-referee"
                    />
                  ) : null}
                </span>

                {match ? (
                  <span className="text-xs font-medium leading-snug text-text-primary">
                    {match.playerAPseudo ?? 'Joueur A'}
                    <span className="text-text-muted"> vs </span>
                    {match.playerBPseudo ?? 'Joueur B'}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">Libre</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}