/**
 * Types partagés pour les composants UI.
 *
 * Ne pas mettre ici de types métier (tournois, paiements, etc.).
 * Uniquement des contrats UI génériques réutilisables.
 */

/** Taille standard des composants graphiques (icônes, boutons, badges, etc.) */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** Variantes de couleur sémantiques du design system */
export type ColorVariant =
  | 'default'
  | 'accent'      // accent-violet
  | 'success'     // success-neon
  | 'warning'     // warning
  | 'danger'      // danger
  | 'admin'       // admin red
  | 'referee'     // referee orange

/** Variantes de boutons (calquées sur shadcn pour cohérence) */
export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'

/** État de chargement d'une ressource côté UI */
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

/** Position commune des éléments flottants (tooltips, popovers, etc.) */
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right'

/** Props communes pour les composants qui acceptent une icône Lucide en prop */
export interface WithLucideIcon {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}