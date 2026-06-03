'use client'

import { useState, useTransition } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { generateDocument, getDocumentUrl, regenerateAll } from '../actions'

export interface DocumentRow {
  id: string
  registrationId: string
  badgeNumber: number | null
  pseudo: string
  isValid: boolean
  generatedAt: string
}

interface Props {
  rows: DocumentRow[]
  canRegenerateAll: boolean
}

export function DocumentsTable({ rows, canRegenerateAll }: Props) {
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function handleDownload(id: string) {
    setBusyId(id)
    startTransition(async () => {
      const res = await getDocumentUrl(id)
      setBusyId(null)
      if (res.success) {
        window.open(res.data.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleRegenerate(registrationId: string) {
    setBusyId(registrationId)
    startTransition(async () => {
      const res = await generateDocument(registrationId)
      setBusyId(null)
      if (res.success) toast.success('Document régénéré.')
      else toast.error(res.error)
    })
  }

  function handleRegenerateAll() {
    startTransition(async () => {
      const res = await regenerateAll()
      if (res.success) {
        toast.success(
          `Régénération terminée : ${res.data.generated} ok, ${res.data.failed} échecs.`,
        )
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="bg-surface-1 rounded-lg p-6">
      {canRegenerateAll ? (
        <div className="mb-4 flex justify-end">
          <Button
            className="bg-admin/10 border-admin text-admin border"
            disabled={isPending}
            onClick={handleRegenerateAll}
          >
            Régénérer tout
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-text-secondary py-8 text-center">
          {'Aucun document généré pour ce tournoi.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-text-secondary border-line border-b">
              <tr>
                <th className="py-3 pr-4">Badge</th>
                <th className="py-3 pr-4">Joueur</th>
                <th className="py-3 pr-4">Statut</th>
                <th className="py-3 pr-4">Généré le</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-line/60 border-b">
                  <td className="py-3 pr-4 font-bold">
                    {row.badgeNumber != null
                      ? String(row.badgeNumber).padStart(3, '0')
                      : '—'}
                  </td>
                  <td className="py-3 pr-4">{row.pseudo}</td>
                  <td className="py-3 pr-4">
                    {row.isValid ? (
                      <span className="text-success-neon">Valide</span>
                    ) : (
                      <span className="text-warning">À régénérer</span>
                    )}
                  </td>
                  <td className="text-text-secondary py-3 pr-4">
                    {formatDate(row.generatedAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        className="min-h-10"
                        disabled={isPending && busyId === row.id}
                        onClick={() => handleDownload(row.id)}
                      >
                        Télécharger
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-10"
                        disabled={isPending && busyId === row.registrationId}
                        onClick={() => handleRegenerate(row.registrationId)}
                      >
                        Régénérer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}