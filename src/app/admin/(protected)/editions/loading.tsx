/**
 * Skeleton de la page Éditions (refonte) — liste en cartes, No-Line.
 */
export default function EditionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface-2/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-surface-2" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-2xl bg-surface-1 p-6"
          >
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded-full bg-surface-2" />
              <div className="h-5 w-48 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-40 animate-pulse rounded bg-surface-2/60" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  )
}