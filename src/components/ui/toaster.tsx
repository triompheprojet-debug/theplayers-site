'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * Toaster — composant racine de sonner, configuré pour notre design system.
 *
 * Override du fichier généré par shadcn (qui dépend de next-themes).
 * On force theme="dark" et on mappe les variables internes de sonner
 * vers nos design tokens via inline style.
 *
 * Usage : monté UNE SEULE FOIS au niveau racine (via <ToastProvider />),
 * jamais directement dans une page.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--color-surface-2)',
          '--normal-text': 'var(--color-text-primary)',
          '--normal-border': 'var(--color-surface-3)',
          '--success-bg': 'var(--color-surface-2)',
          '--success-text': 'var(--color-success-neon)',
          '--success-border': 'var(--color-success-neon)',
          '--error-bg': 'var(--color-surface-2)',
          '--error-text': 'var(--color-danger)',
          '--error-border': 'var(--color-danger)',
          '--warning-bg': 'var(--color-surface-2)',
          '--warning-text': 'var(--color-warning)',
          '--warning-border': 'var(--color-warning)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }