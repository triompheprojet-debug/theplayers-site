'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { ROUTES } from '@/config/routes'

/**
 * Bouton « Retour » des pages d'authentification.
 * Revient à la page précédente ; repli sur l'accueil public si aucun
 * historique (entrée directe sur /connexion ou /inscription).
 */
export function BackButton() {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(ROUTES.home)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1 rounded-md text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      <span>Retour</span>
    </button>
  )
}