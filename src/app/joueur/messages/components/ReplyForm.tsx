'use client'

import { SendHorizontal } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ActionResult } from '@/types/api.types'

interface ReplyFormProps {
  parentMessageId: string
  /** Server Action passee par la page (evite un import a travers le segment [id]). */
  action: (input: {
    parentMessageId: string
    body: string
  }) => Promise<ActionResult<{ messageId: string }>>
}

/**
 * Formulaire de reponse joueur (mobile-first). Affiche uniquement si le message
 * autorise les reponses. Le serveur reste l'autorite (re-verification).
 */
export function ReplyForm({ parentMessageId, action }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (body.trim() === '') {
      toast.error('Ecris ta reponse.')
      return
    }
    setSubmitting(true)
    try {
      const res = await action({ parentMessageId, body })
      if (res.success) {
        toast.success('Reponse envoyee.')
        setBody('')
      } else {
        toast.error(res.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        rows={4}
        disabled={submitting}
        placeholder="Ta reponse"
        className={cn(
          'w-full rounded-md border border-border bg-surface-2 px-3 py-2',
          'text-sm text-text-primary placeholder:text-text-secondary',
          'focus:outline-none focus:ring-2 focus:ring-accent-violet/50',
          'disabled:opacity-50',
        )}
      />
      <Button type="button" onClick={handleSubmit} disabled={submitting}>
        <SendHorizontal className="size-4" aria-hidden />
        <span className="ml-2">{submitting ? 'Envoi...' : 'Repondre'}</span>
      </Button>
    </div>
  )
}