/**
 * Ligne rouge fine en haut de toutes les pages admin.
 *
 * Signal visuel discret qui différencie le back-office du reste du site.
 * Server Component (aucune interactivité).
 */
export function AdminRedLine() {
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-red-600"
    />
  )
}