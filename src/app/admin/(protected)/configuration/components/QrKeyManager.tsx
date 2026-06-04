'use client'

import { AlertTriangle, KeyRound } from 'lucide-react'
import Link from 'next/link'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/config/routes'

import { regenerateQrKeysAction } from '../qr/actions'

const CONFIRM_PHRASE = 'REGENERER'

interface QrKeyManagerProps {
  encryptionKeyPresent: boolean
  signingKeyPresent: boolean
}

/**
 * Gestion des cles QR (SUPER_ADMIN). On n'affiche JAMAIS la valeur des cles,
 * seulement leur presence. La regeneration exige une double confirmation
 * (ouverture du dialogue + saisie d'une phrase) car elle invalide tous les badges.
 */
export function QrKeyManager({
  encryptionKeyPresent,
  signingKeyPresent,
}: QrKeyManagerProps) {
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const confirmed = phrase.trim().toUpperCase() === CONFIRM_PHRASE

  async function handleRegenerate() {
    if (!confirmed) return
    setSubmitting(true)
    try {
      const res = await regenerateQrKeysAction()
      if (res.success) {
        toast.success(
          `Cles regenerees. ${res.data.invalidatedCount} badge(s) invalide(s).`,
        )
        setOpen(false)
        setPhrase('')
      } else {
        toast.error(res.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-1 p-6">
      <div className="flex items-center gap-3">
        <KeyRound className="size-5 text-text-secondary" aria-hidden />
        <h2 className="text-lg font-semibold text-text-primary">Cles QR</h2>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        <KeyState label="Cle de chiffrement" present={encryptionKeyPresent} />
        <KeyState label="Cle de signature" present={signingKeyPresent} />
      </ul>

      <div className="rounded-lg bg-warning/10 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-warning">
          <AlertTriangle className="size-4" aria-hidden />
          Action critique
        </p>
        <p className="mt-2 text-text-secondary">
          Regenerer les cles invalide TOUS les badges deja emis. Il faut ensuite
          relancer la generation des PDF pour produire de nouveaux QR valides.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            Regenerer les cles QR
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la regeneration</DialogTitle>
            <DialogDescription>
              Tous les badges actuels seront invalides. Cette action est
              irreversible.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-secondary">
              Pour confirmer, tape{' '}
              <strong className="text-text-primary">{CONFIRM_PHRASE}</strong>.
            </p>
            <Input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleRegenerate}
              disabled={!confirmed || submitting}
            >
              {submitting ? 'Regeneration...' : 'Confirmer et regenerer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button asChild variant="outline" size="sm">
        <Link href={ROUTES.admin.documents}>Aller regenerer les PDF</Link>
      </Button>
    </div>
  )
}

function KeyState({ label, present }: { label: string; present: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className={present ? 'text-success-neon' : 'text-danger'}>
        {present ? 'Presente' : 'Absente'}
      </span>
    </li>
  )
}