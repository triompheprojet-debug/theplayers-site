'use client'

import { Eye, EyeOff } from 'lucide-react'
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
import { cn } from '@/lib/utils'

type SignInFormValues = z.infer<typeof signInSchema>

const LABEL_CLS = 'text-xs font-bold uppercase tracking-wider text-text-secondary'
const INPUT_CLS =
  'h-12 border-0 bg-surface-2 dark:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-violet'

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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

      const next = searchParams.get('next')
      const destination =
        next && next.startsWith('/joueur') ? next : result.data.redirect

      router.push(destination)
      router.refresh()
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Connexion</h1>
          <p className="text-sm text-text-secondary">
            Connecte-toi avec ton pseudo de joueur.
          </p>
        </div>

        <FormField
          control={form.control}
          name="pseudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Pseudo</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="TonPseudo"
                  className={INPUT_CLS}
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
              <FormLabel className={LABEL_CLS}>Mot de passe</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn(INPUT_CLS, 'pr-12')}
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
                >
                  {showPassword ? (
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

        {formError && (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          className="min-h-12 w-full bg-accent-violet text-white hover:bg-accent-violet/90"
          disabled={isPending}
        >
          {isPending ? 'Connexion…' : 'Se connecter'}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          Pas encore de compte ?{' '}
          <Link
            href={ROUTES.signUp}
            className="text-accent-violet underline-offset-4 hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </form>
    </Form>
  )
}