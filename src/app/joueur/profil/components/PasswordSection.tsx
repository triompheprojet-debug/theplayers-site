'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { passwordChangeSchema } from '@/lib/validation/profile'

import { changePassword } from '../actions'

// Pas de `.transform` ici → `z.infer` simple suffit.
type FormValues = z.infer<typeof passwordChangeSchema>

const EMPTY: FormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const LABEL_CLS = 'text-xs font-bold uppercase tracking-wider text-text-secondary'
const INPUT_CLS =
  'h-12 border-0 bg-background pr-12 dark:bg-background focus-visible:ring-2 focus-visible:ring-accent-violet'

/**
 * Changement de mot de passe.
 * Le mot de passe actuel est re-vérifié côté serveur avant tout changement.
 */
export function PasswordSection() {
  const form = useForm<FormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: EMPTY,
  })

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: FormValues) {
    const result = await changePassword(values)

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof FormValues, {
            message: messages[0],
          })
        }
      }
      toast.error(result.error)
      return
    }

    form.reset(EMPTY)
    toast.success('Mot de passe modifié.')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Ancien mot de passe</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    className={INPUT_CLS}
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={
                    showCurrent ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
                >
                  {showCurrent ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Nouveau mot de passe</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    className={INPUT_CLS}
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={
                    showNew ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
                >
                  {showNew ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>
                Confirmer le nouveau mot de passe
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    className={INPUT_CLS}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={
                    showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
        >
          {isSubmitting ? 'Modification…' : 'Changer le mot de passe'}
        </Button>
      </form>
    </Form>
  )
}