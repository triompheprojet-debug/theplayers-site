'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { deleteMessageAction, editMessageAction } from '../actions'

export interface SentMessage {
  id: string
  subject: string
  body: string
  sent_at: string | null
  read_at: string | null
  allow_replies: boolean
  edited_at: string | null
  broadcast_scope: string | null
  recipient: { pseudo: string } | null
}

/**
 * Historique des messages envoyes par l'admin (P3). Modifier (Dialog) ou
 * supprimer (suppression douce, confirmation). Le serveur reste l'autorite.
 */
export function SentMessagesList({ messages }: { messages: SentMessage[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<SentMessage | null>(null)
  const [deleting, setDeleting] = useState<SentMessage | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  function openEdit(m: SentMessage) {
    setEditing(m)
    setSubject(m.subject)
    setBody(m.body)
  }

  async function saveEdit() {
    if (!editing) return
    if (subject.trim() === '' || body.trim() === '') {
      toast.error('Sujet et message sont requis.')
      return
    }
    setBusy(true)
    try {
      const res = await editMessageAction({ messageId: editing.id, subject, body })
      if (res.success) {
        toast.success('Message modifie.')
        setEditing(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      const res = await deleteMessageAction({ messageId: deleting.id })
      if (res.success) {
        toast.success('Message supprime.')
        setDeleting(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setBusy(false)
    }
  }

  if (messages.length === 0) {
    return (
      <p className="rounded-xl bg-surface-1 p-6 text-center text-sm text-text-secondary">
        {"Tu n'as encore envoye aucun message."}
      </p>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {messages.map((m) => (
          <li key={m.id} className="rounded-xl bg-surface-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-text-primary">
                  {m.subject}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
                  <span>
                    {m.broadcast_scope
                      ? 'Diffusion'
                      : (m.recipient?.pseudo ?? 'Joueur')}
                  </span>
                  {m.sent_at ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{new Date(m.sent_at).toLocaleString('fr-FR')}</span>
                    </>
                  ) : null}
                  <span aria-hidden>·</span>
                  <span>{m.read_at ? 'Lu' : 'Non lu'}</span>
                  {m.allow_replies ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>Reponses autorisees</span>
                    </>
                  ) : null}
                  {m.edited_at ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="text-warning">Modifie</span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(m)}
                  aria-label="Modifier le message"
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleting(m)}
                  aria-label="Supprimer le message"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-text-secondary">
              {m.body}
            </p>
          </li>
        ))}
      </ul>

      {/* Dialog modification */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le message</DialogTitle>
            <DialogDescription>
              {"Le joueur verra le contenu mis a jour. Un marqueur indiquera que le message a ete modifie."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-subject">Sujet</Label>
              <Input
                id="edit-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                disabled={busy}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-body">Message</Label>
              <textarea
                id="edit-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={4000}
                rows={6}
                disabled={busy}
                className={cn(
                  'w-full rounded-md border border-border bg-surface-2 px-3 py-2',
                  'text-sm text-text-primary placeholder:text-text-secondary',
                  'focus:outline-none focus:ring-2 focus:ring-accent-violet/50',
                  'disabled:opacity-50',
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={busy}
            >
              Annuler
            </Button>
            <Button onClick={saveEdit} disabled={busy}>
              {busy ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog suppression */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le message</DialogTitle>
            <DialogDescription>
              {"Le message disparaitra cote joueur. Il reste conserve en base pour l'audit."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={busy}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {busy ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}