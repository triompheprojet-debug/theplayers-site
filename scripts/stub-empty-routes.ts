/**
 * Stub des fichiers de routing Next.js vides.
 *
 * Parcourt `src/app/` et remplit les `page.tsx`, `layout.tsx`, `route.ts` vides
 * avec un contenu minimal valide. À exécuter une fois après création de l'arborescence,
 * et à relancer si tu ajoutes de nouveaux dossiers vides.
 *
 * - page.tsx vide   → notFound() (404 propre tant que la page n'est pas codée)
 * - layout.tsx vide → pass-through children
 * - route.ts vide   → handler GET retournant 501 Not Implemented
 *
 * Les fichiers déjà remplis sont laissés intacts.
 *
 * Usage : pnpm tsx scripts/stub-empty-routes.ts
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGE_STUB = `import { notFound } from 'next/navigation'

export default function Page() {
  notFound()
}
`

const LAYOUT_STUB = `import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
`

const ROUTE_STUB = `import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 },
  )
}
`

const STUBS: Record<string, string> = {
  'page.tsx': PAGE_STUB,
  'layout.tsx': LAYOUT_STUB,
  'route.ts': ROUTE_STUB,
}

function isEmpty(filePath: string): boolean {
  try {
    return readFileSync(filePath, 'utf8').trim().length === 0
  } catch {
    return false
  }
}

function walk(dir: string, onFile: (full: string, name: string) => void): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      walk(full, onFile)
    } else if (stats.isFile()) {
      onFile(full, entry)
    }
  }
}

const ROOT = 'src/app'
let stubbed = 0
let skipped = 0

walk(ROOT, (full, name) => {
  const stub = STUBS[name]
  if (!stub) return

  if (isEmpty(full)) {
    writeFileSync(full, stub, 'utf8')
    console.log(`  stub   ${full}`)
    stubbed++
  } else {
    skipped++
  }
})

console.log(`\n${stubbed} fichier(s) stubé(s), ${skipped} déjà rempli(s) (ignorés).`)