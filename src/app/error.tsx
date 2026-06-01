'use client'

import { RotateCcw } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Erreur globale (M05). Client Component obligatoire (prop reset).
 * Restylée selon le design system. Ne révèle pas le détail technique au public.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-16 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-surface-1 text-danger">
        <RotateCcw className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold text-text-primary">
        Une erreur est survenue
      </h1>
      <p className="max-w-md text-sm text-text-secondary">
        Quelque chose s&apos;est mal passé. Vous pouvez réessayer ; si le
        problème persiste, revenez un peu plus tard.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-accent-violet px-6 font-semibold text-text-on-accent active:scale-[0.98]"
      >
        <RotateCcw className="size-4" aria-hidden />
        Réessayer
      </button>
    </main>
  )
}