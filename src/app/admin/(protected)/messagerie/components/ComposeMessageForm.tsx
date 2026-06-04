'use client'

import { Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { broadcastMessageAction, sendMessageAction } from '../actions'
import { RecipientSelector, type RecipientOption } from './RecipientSelector'
import { TemplatesBottomSheet } from './TemplatesBottomSheet'

import type { MessageTemplates } from '@/types/config.types'

type Mode = 'single' | 'broadcast'
type Scope = 'all_confirmed' | 'all_registered'

interface ComposeMessageFormProps {
  recipients: RecipientOption[]
  templates: MessageTemplates
  hasActiveTournament: boolean
}

const SCOPE_LABELS: Record<Scope, string> = {
  all_confirmed: 'Joueurs confirmes (paiement valide)',
  all_registered: 'Tous les inscrits (reserves + en attente + confirmes)',
}

export function ComposeMessageForm({
  recipients,
  templates,
  hasActiveTournament,
}: ComposeMessageFormProps) {
  const [mode, setMode] = useState<Mode>('single')
  const [recipientId, setRecipientId] = useState('')
  const [scope, setScope] = useState<Scope>('all_confirmed')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [allowReplies, setAllowReplies] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function resetContent() {
    setSubject('')
    setBody('')
    setAllowReplies(false)
    setRecipientId('')
  }

  async function handleSubmit() {
    if (subject.trim() === '' || body.trim() === '') {
      toast.error('Sujet et message sont requis.')
      return
    }
    if (mode === 'single' && recipientId === '') {
      toast.error('Choisis un destinataire.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'single') {
        const res = await sendMessageAction({
          recipientPlayerId: recipientId,
          subject,
          body,
          allowReplies,
        })
        if (res.success) {
          toast.success('Message envoye.')
          resetContent()
        } else {
          toast.error(res.error)
        }
      } else {
        const res = await broadcastMessageAction({
          scope,
          subject,
          body,
          allowReplies,
        })
        if (res.success) {
          toast.success(
            `Message diffuse a ${res.data.recipientCount} joueur(s).`,
          )
          resetContent()
        } else {
          toast.error(res.error)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl bg-surface-1 p-6">
      {/* Mode */}
      <div className="flex gap-2">
        <ModeButton
          active={mode === 'single'}
          onClick={() => setMode('single')}
          label="Un joueur"
        />
        <ModeButton
          active={mode === 'broadcast'}
          onClick={() => setMode('broadcast')}
          label="Diffusion"
        />
      </div>

      {/* Destinataire / scope */}
      {mode === 'single' ? (
        <div className="flex flex-col gap-2">
          <Label>Destinataire</Label>
          <RecipientSelector
            recipients={recipients}
            value={recipientId}
            onChange={setRecipientId}
            disabled={submitting}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label>Destinataires</Label>
          {hasActiveTournament ? (
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as Scope)}
              disabled={submitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SCOPE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-text-secondary">
              Aucun tournoi actif : la diffusion est indisponible.
            </p>
          )}
        </div>
      )}

      {/* Modeles */}
      <div>
        <TemplatesBottomSheet
          templates={templates}
          onApply={(t) => {
            setSubject(t.subject)
            setBody(t.body)
          }}
        />
      </div>

      {/* Sujet */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="msg-subject">Sujet</Label>
        <Input
          id="msg-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
          disabled={submitting}
          placeholder="Objet du message"
        />
      </div>

      {/* Corps (textarea natif : pas de textarea shadcn dans le projet) */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="msg-body">Message</Label>
        <textarea
          id="msg-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          rows={6}
          disabled={submitting}
          placeholder="Contenu du message"
          className={cn(
            'w-full rounded-md border border-border bg-surface-2 px-3 py-2',
            'text-sm text-text-primary placeholder:text-text-secondary',
            'focus:outline-none focus:ring-2 focus:ring-accent-violet/50',
            'disabled:opacity-50',
          )}
        />
      </div>

      {/* Autoriser reponses */}
      <label className="flex items-center gap-3 text-sm text-text-primary">
        <input
          type="checkbox"
          checked={allowReplies}
          onChange={(e) => setAllowReplies(e.target.checked)}
          disabled={submitting}
          className="size-4 accent-accent-violet"
        />
        Autoriser le joueur a repondre a ce message
      </label>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || (mode === 'broadcast' && !hasActiveTournament)}
      >
        <Send className="size-4" aria-hidden />
        <span className="ml-2">
          {submitting ? 'Envoi...' : mode === 'single' ? 'Envoyer' : 'Diffuser'}
        </span>
      </Button>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent-violet/15 text-accent-violet'
          : 'bg-surface-2 text-text-secondary hover:text-text-primary',
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}