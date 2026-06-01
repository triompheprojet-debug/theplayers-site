'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { signIn } from '@/app/(auth)/connexion/actions'
import { signInSchema } from '@/lib/validation/auth'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type SignInFormValues = z.infer<typeof signInSchema>

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { pseudo: '', password: '' },
  })

  function onSubmit(values: SignInFormValues) {
    setFormError(null)

    startTransition(async () => {
      const result = await signIn(values)

      if (!result.success) {
        setFormError(result.error)
        return
      }

      // Respecte ?next= s'il pointe vers une route interne /joueur.
      const next = searchParams.get('next')
      const destination =
        next && next.startsWith('/joueur') ? next : result.data.redirect

      router.push(destination)
      router.refresh()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-text-secondary">
            Connecte-toi avec ton pseudo de joueur.
          </p>
        </div>

        <FormField
          control={form.control}
          name="pseudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pseudo</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="TonPseudo"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full"
          disabled={isPending}
        >
          {isPending ? 'Connexion…' : 'Se connecter'}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          Pas encore de compte ?{' '}
          <Link href={ROUTES.signUp} className="text-accent-violet underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </p>
      </form>
    </Form>
  )
}