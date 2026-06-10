'use client'

import { Download, FileText } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { downloadDocument } from '../actions'

export interface PlayerDocument {
  id: string
  badgeNumber: number | null
  tournamentName: string
  generatedAt: string
}

export function DocumentCard({ doc }: { doc: PlayerDocument }) {
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    startTransition(async () => {
      const res = await downloadDocument(doc.id)
      if (res.success) {
        window.open(res.data.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(res.error)
      }
    })
  }

  const badge =
    doc.badgeNumber != null
      ? `#${String(doc.badgeNumber).padStart(3, '0')}`
      : null

  return (
    <article className="space-y-4 rounded-2xl bg-surface-1 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent-violet">
            <FileText className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-text-primary">{'Reçu & badge'}</h2>
            <p className="truncate text-xs uppercase tracking-wider text-text-secondary">
              {doc.tournamentName}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-success-neon/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-neon">
          Disponible
        </span>
      </div>

      <div className="flex items-end justify-between gap-4 rounded-xl bg-surface-2 p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            N° joueur
          </p>
          <p className="font-mono text-3xl font-bold tracking-wider text-text-primary">
            {badge ?? '—'}
          </p>
        </div>
        <p className="font-mono text-xs text-text-secondary">
          {formatDate(doc.generatedAt)}
        </p>
      </div>

      <Button
        onClick={handleDownload}
        disabled={isPending}
        className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {isPending ? 'Préparation…' : 'Télécharger le PDF'}
      </Button>
    </article>
  )
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(
      new Date(iso),
    )
  } catch {
    return '—'
  }
}