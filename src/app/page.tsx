import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="rounded-xl bg-surface-1 p-8 shadow-glow-violet max-w-md">
        <h1 className="text-3xl font-bold text-text-primary">THE PLAYERS</h1>
        <p className="mt-2 text-text-secondary">
          Page d&apos;accueil temporaire — la version finale sera générée en M05.
        </p>
        <span className="mt-4 inline-block text-xs uppercase tracking-wider font-semibold text-success-neon">
          M01 OK
        </span>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <Button asChild variant="secondary">
          <Link href="/dev/components">Voir la galerie de composants →</Link>
        </Button>
      )}
    </main>
  )
}