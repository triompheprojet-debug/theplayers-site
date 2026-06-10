'use client'

import { SendHorizontal } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ActionResult } from '@/types/api.types'

interface ReplyFormProps {
  parentMessageId: string
  /** Server Action passée par la page (évite un import à travers le segment [id]). */
  action: (input: {
    parentMessageId: string
    body: string
  }) => Promise<ActionResult<{ messageId: string }>>
  /** Réponses encore disponibles (le serveur reste l'autorité). */
  remaining?: number
}

/**
 * Formulaire de réponse joueur (mobile-first). Affiché par la page uniquement si
 * le message autorise les réponses ET qu'il reste du quota. Le serveur revérifie
 * l'autorisation et le quota (la RLS + le trigger DB sont les barrières dures).
 */
export function ReplyForm({ parentMessageId, action, remaining }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const quotaReached = remaining !== undefined && remaining <= 0

  async function handleSubmit() {
    if (quotaReached) return
    if (body.trim() === '') {
      toast.error('Écris ta réponse.')
      return
    }
    setSubmitting(true)
    try {
      const res = await action({ parentMessageId, body })
      if (res.success) {
        toast.success('Réponse envoyée.')
        setBody('')
      } else {
        toast.error(res.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {remaining !== undefined ? (
        <p className="text-xs text-text-secondary">
          {`Il te reste ${remaining} réponse${remaining > 1 ? 's' : ''} pour ce message.`}
        </p>
      ) : null}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        rows={4}
        disabled={submitting || quotaReached}
        placeholder="Ta réponse"
        className={cn(
          'w-full rounded-xl border-0 bg-surface-2 px-3 py-3',
          'text-sm text-text-primary placeholder:text-text-secondary',
          'focus:outline-none focus:ring-2 focus:ring-accent-violet',
          'disabled:opacity-50',
        )}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || quotaReached}
        className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
      >
        <SendHorizontal className="h-4 w-4" aria-hidden="true" />
        {submitting ? 'Envoi…' : 'Répondre'}
      </Button>
    </div>
  )
}