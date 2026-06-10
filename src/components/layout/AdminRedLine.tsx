/**
 * Ligne rouge fine en haut de toutes les pages admin (token `admin` = #dc2626).
 * Server Component, aucune interactivité.
 */
export function AdminRedLine() {
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-admin"
    />
  )
}