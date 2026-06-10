'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { signUp } from '@/app/(auth)/inscription/actions'
import { signUpSchema } from '@/lib/validation/auth'
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

// phoneSchema applique un .transform → Input ≠ Output.
// Pattern 3-génériques imposé (MISE_A_JOUR §3.2) : <Input, unknown, Output>.
type SignUpFormInput = z.input<typeof signUpSchema>
type SignUpFormOutput = z.output<typeof signUpSchema>

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const LABEL_CLS = 'text-xs font-bold uppercase tracking-wider text-text-secondary'
const INPUT_CLS =
  'h-12 border-0 bg-surface-2 dark:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-violet'

export function SignUpForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<SignUpFormInput, unknown, SignUpFormOutput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      pseudo: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptRules: false,
      turnstileToken: '',
    },
  })

  // Turnstile appelle des callbacks globaux ; on les relie à l'état RHF.
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.onTurnstileSuccess = (token: string) => {
      form.setValue('turnstileToken', token, { shouldValidate: true })
    }
    w.onTurnstileExpired = () => {
      form.setValue('turnstileToken', '')
    }
    return () => {
      delete w.onTurnstileSuccess
      delete w.onTurnstileExpired
    }
  }, [form])

  function onSubmit(values: SignUpFormOutput) {
    setFormError(null)

    // Honeypot lu sur le DOM (champ hors schéma) : un bot le remplit.
    const honeypot =
      (
        document.getElementById('company_website') as HTMLInputElement | null
      )?.value ?? ''

    startTransition(async () => {
      const result = await signUp({
        ...values,
        company_website: honeypot,
      })

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof SignUpFormOutput, {
              message: messages[0],
            })
          }
        }
        setFormError(result.error)
        // Token Turnstile à usage unique → reset après tentative.
        form.setValue('turnstileToken', '')
        const w = window as unknown as { turnstile?: { reset: () => void } }
        w.turnstile?.reset()
        return
      }

      router.push(result.data.redirect)
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
          <h1 className="text-2xl font-bold text-text-primary">Créer un compte</h1>
          <p className="text-sm text-text-secondary">
            Rejoins la compétition. Choisis ton pseudo de joueur.
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

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLS}>Prénom</FormLabel>
                <FormControl>
                  <Input autoComplete="given-name" className={INPUT_CLS} {...field} />
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
                  <Input autoComplete="family-name" className={INPUT_CLS} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>Téléphone (WhatsApp)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="06 00 00 00 00"
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
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={LABEL_CLS}>
                Confirmer le mot de passe
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn(INPUT_CLS, 'pr-12')}
                    {...field}
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

        <FormField
          control={form.control}
          name="acceptRules"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0 accent-accent-violet"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                />
                <span className="text-text-secondary">
                  J&apos;accepte le règlement du tournoi et les conditions
                  d&apos;utilisation.
                </span>
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Honeypot anti-bot : invisible pour l'humain, rempli par les bots.
            Hors schéma Zod, lu côté serveur sur le payload brut. */}
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="company_website">Ne pas remplir</label>
          <input
            id="company_website"
            name="company_website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {/* Widget Turnstile : rendu explicite via callbacks globaux. */}
        <div
          className="cf-turnstile"
          data-sitekey={TURNSTILE_SITE_KEY}
          data-callback="onTurnstileSuccess"
          data-expired-callback="onTurnstileExpired"
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
          {isPending ? 'Création…' : 'Créer mon compte'}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          Déjà inscrit ?{' '}
          <Link
            href={ROUTES.signIn}
            className="text-accent-violet underline-offset-4 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  )
}