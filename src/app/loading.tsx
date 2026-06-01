/**
 * Loader global (M05). Spinner aux tokens du projet (violet sur fond sombre).
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div
        className="size-8 animate-spin rounded-full border-4 border-surface-3 border-t-accent-violet"
        role="status"
        aria-label="Chargement"
      />
    </div>
  )
}