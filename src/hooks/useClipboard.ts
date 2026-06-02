'use client'

import { useCallback, useState } from 'react'

/**
 * Hook de copie presse-papiers (M09 — copier un numéro de dépôt en un tap).
 *
 * `copy(text)` renvoie un booléen de succès et bascule `copied` à true pendant
 * `resetMs` (défaut 2 s) pour un retour visuel (« Copié ! »).
 */
export function useClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(text)
        } else {
          // Repli (contextes non sécurisés / vieux navigateurs)
          const ta = document.createElement('textarea')
          ta.value = text
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
        setCopied(true)
        window.setTimeout(() => setCopied(false), resetMs)
        return true
      } catch {
        setCopied(false)
        return false
      }
    },
    [resetMs],
  )

  return { copied, copy }
}