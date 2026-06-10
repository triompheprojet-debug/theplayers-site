/**
 * Layout racine de /admin/*.
 *
 * Passthrough volontaire : tout le shell admin (sidebar, topbar, garde
 * d'authentification) est porté par `src/app/admin/(protected)/layout.tsx`.
 *
 * Ce layout neutre permet à `/admin/login` et `/admin/logout` (pages
 * publiques) de s'afficher sans déclencher `requireAdmin()` — ce qui
 * causerait une boucle de redirection infinie.
 *
 * Si M02 avait des éléments dans ce layout (à vérifier), les déplacer
 * sous (protected)/layout.tsx ou les conserver ici uniquement s'ils
 * doivent rester visibles sur login (peu probable).
 */
import type { ReactNode } from 'react'

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}