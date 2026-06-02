'use client'

import { zodResolver } from '@hookform/resolvers/zod'
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

/**
 * Changement de mot de passe.
 * Le mot de passe actuel est re-vérifié côté serveur avant tout changement.
 */
export function PasswordSection() {
  const form = useForm<FormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: EMPTY,
  })

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
              <FormLabel>Mot de passe actuel</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-12"
                  type="password"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nouveau mot de passe</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-12"
                  type="password"
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-12"
                  type="password"
                  autoComplete="new-password"
                />
              </FormControl>
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