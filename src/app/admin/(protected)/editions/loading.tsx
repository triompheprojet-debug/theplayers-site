/**
 * Skeleton de la page Éditions (M03.D).
 *
 * Affiché automatiquement par Next.js pendant le chargement initial
 * (Server Component avec await sur listEditions).
 */
import { cn } from '@/lib/utils'

export default function EditionsLoading() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-surface-2 animate-pulse" />
          <div className="h-4 w-72 rounded bg-surface-2/60 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-44 rounded-md bg-surface-2 animate-pulse" />
          <div className="h-8 w-36 rounded-md bg-surface-2 animate-pulse" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
        <div className="border-b border-border bg-surface-2/40 px-6 py-3">
          <div className="h-3 w-full max-w-md rounded bg-surface-2 animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'px-6 py-4',
              'border-b border-border last:border-0',
              'flex items-center justify-between gap-4',
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-5 w-24 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-4 w-40 rounded bg-surface-2 animate-pulse" />
              <div className="h-4 w-28 rounded bg-surface-2/60 animate-pulse" />
            </div>
            <div className="h-8 w-16 rounded-md bg-surface-2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}