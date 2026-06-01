'use client'

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

// phoneSchema applique un .transform → Input ≠ Output.
// Pattern 3-génériques imposé (MISE_A_JOUR §3.2) : <Input, unknown, Output>.
type SignUpFormInput = z.input<typeof signUpSchema>
type SignUpFormOutput = z.output<typeof signUpSchema>

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function SignUpForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-sm text-text-secondary">
            Rejoins la compétition. Choisis ton pseudo de joueur.
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

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input autoComplete="given-name" {...field} />
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
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input autoComplete="family-name" {...field} />
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
              <FormLabel>Téléphone (WhatsApp)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="06 00 00 00 00"
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
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  {...field}
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
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
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
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
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

        {/* Widget Turnstile : rendu explicite via callbacks globaux.
            Voir TurnstileScript dans la page (charge l'API Cloudflare). */}
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
          size="lg"
          className="h-12 w-full"
          disabled={isPending}
        >
          {isPending ? 'Création…' : 'Créer mon compte'}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          Déjà inscrit ?{' '}
          <Link href={ROUTES.signIn} className="text-accent-violet underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  )
}