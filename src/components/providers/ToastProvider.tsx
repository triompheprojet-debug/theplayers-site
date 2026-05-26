'use client'

import { Toaster } from '@/components/ui/toaster'

/**
 * ToastProvider — paramètres globaux de notifications toast.
 *
 * Monté une seule fois dans layout.tsx (racine de l'app).
 *
 * Pour déclencher un toast depuis n'importe quel Client Component :
 *   import { toast } from 'sonner'
 *   toast.success('Inscription confirmée')
 *   toast.error('Numéro de téléphone invalide')
 *   toast.info('La fenêtre d\'inscription se ferme bientôt')
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={4000}
      visibleToasts={3}
      expand={false}
    />
  )
}