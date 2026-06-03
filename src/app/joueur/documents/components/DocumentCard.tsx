'use client'

import { useTransition } from 'react'

import { Download } from 'lucide-react'
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

  return (
    <div className="bg-surface-1 rounded-2xl p-6">
      <p className="text-text-secondary text-xs uppercase tracking-wider">
        {doc.tournamentName}
      </p>

      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-text-secondary text-sm">Numéro de badge</p>
          <p className="text-4xl font-bold">
            {doc.badgeNumber != null
              ? String(doc.badgeNumber).padStart(3, '0')
              : '—'}
          </p>
        </div>
        <p className="text-text-secondary text-xs">
          {formatDate(doc.generatedAt)}
        </p>
      </div>

      <Button
        className="mt-4 min-h-12 w-full"
        disabled={isPending}
        onClick={handleDownload}
      >
        <Download className="mr-2 h-4 w-4" aria-hidden />
        Télécharger le PDF
      </Button>
    </div>
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