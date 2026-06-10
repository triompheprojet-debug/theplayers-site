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
import { profileUpdateSchema } from '@/lib/validation/profile'

import { updateProfile } from '../actions'

// `phone` a un `.transform` (normalisation E.164) → pattern 3-génériques RHF
// (input ≠ output). cf. pièges projet.
type FormInput = z.input<typeof profileUpdateSchema>
type FormOutput = z.output<typeof profileUpdateSchema>

interface ProfileFormProps {
  defaultValues: {
    firstName: string
    lastName: string
    phone: string
  }
}

const LABEL_CLS = 'text-xs font-bold uppercase tracking-wider text-text-secondary'
const INPUT_CLS =
  'h-12 border-0 bg-background dark:bg-background focus-visible:ring-2 focus-visible:ring-accent-violet'

/**
 * Édition des informations personnelles du joueur.
 * Le pseudo n'apparaît PAS (immuable, Règle 2 + trigger DB).
 */
export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues,
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: FormOutput) {
    const result = await updateProfile(values)

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof FormInput, {
            message: messages[0],
          })
        }
      }
      toast.error(result.error)
      return
    }

    // Resynchronise les valeurs par défaut (champ phone normalisé).
    form.reset(values)
    toast.success('Profil mis à jour.')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Prénom</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={INPUT_CLS}
                  autoComplete="given-name"
                  placeholder="Ton prénom"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Nom</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={INPUT_CLS}
                  autoComplete="family-name"
                  placeholder="Ton nom"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Numéro de téléphone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={INPUT_CLS}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+242 06 XX XX XX XX"
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
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </Button>
      </form>
    </Form>
  )
}