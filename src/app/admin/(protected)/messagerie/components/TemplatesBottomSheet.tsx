'use client'

import { FileText } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import type { MessageTemplates } from '@/types/config.types'

interface TemplatesBottomSheetProps {
  templates: MessageTemplates
  onApply: (template: { subject: string; body: string }) => void
}

/**
 * Feuille du bas listant les templates de `app_config.message_templates`
 * (Regle 11 : zero hardcode). Au choix, remplit sujet + corps du formulaire.
 */
export function TemplatesBottomSheet({
  templates,
  onApply,
}: TemplatesBottomSheetProps) {
  const [open, setOpen] = useState(false)
  const entries = Object.entries(templates)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileText className="size-4" aria-hidden />
          <span className="ml-2">Utiliser un modele</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modeles de message</SheetTitle>
          <SheetDescription>
            Choisis un modele pour pre-remplir le sujet et le contenu.
          </SheetDescription>
        </SheetHeader>

        {entries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-secondary">
            Aucun modele configure pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 px-4 py-4">
            {entries.map(([key, template]) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    onApply(template)
                    setOpen(false)
                  }}
                  className="w-full rounded-lg border border-border bg-surface-1 p-3 text-left transition-colors hover:bg-surface-2"
                >
                  <p className="text-sm font-semibold text-text-primary">
                    {template.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                    {template.body}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}