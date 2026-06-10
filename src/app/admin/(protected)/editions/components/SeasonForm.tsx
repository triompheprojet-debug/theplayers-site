'use client'

/**
 * Formulaire de création d'une saison (M03.F).
 *
 * Architecture identique à OffSeasonForm (M03.E) mais beaucoup plus simple :
 *  - 6 champs, 1 seule Card
 *  - react-hook-form + zodResolver(seasonCreateSchema)
 *  - Pattern 3-génériques useForm<FormInput, unknown, FormOutput> pour gérer
 *    z.coerce.number() (season_number, expected_tournaments, qualification_threshold)
 *
 * Pas de pré-remplissage : une saison ne dérive pas de tournament_defaults.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { seasonCreateSchema } from '@/lib/validation/season'

import { createSeasonAction } from '../saisons/nouvelle/actions'

// ===========================================================================
// Types — pattern input/output pour gérer z.coerce.number()
// ===========================================================================
type FormInput = z.input<typeof seasonCreateSchema>
type FormOutput = z.output<typeof seasonCreateSchema>

// ===========================================================================
// Valeurs initiales
// ===========================================================================
function buildInitialValues(): FormInput {
  return {
    name: '',
    season_number: 1,
    description: '',
    start_date: '',
    end_date: '',
    expected_tournaments: 12,
    qualification_threshold: 30,
  } as FormInput
}

// ===========================================================================
// Composant principal
// ===========================================================================
export function SeasonForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(seasonCreateSchema),
    defaultValues: buildInitialValues(),
    mode: 'onBlur',
  })

  const onSubmit = (values: FormOutput) => {
    startTransition(async () => {
      const result = await createSeasonAction(values)
      if (result.success) {
        toast.success('Saison créée.')
        router.push(result.data.redirectTo)
      } else {
        if (result.fieldErrors) {
          for (const [path, messages] of Object.entries(result.fieldErrors)) {
            form.setError(path as FieldPath<FormInput>, {
              type: 'server',
              message: messages[0],
            })
          }
        }
        toast.error(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
          <CardHeader>
            <CardTitle>Informations de la saison</CardTitle>
            <CardDescription>
              Période, numéro et seuil de qualification pour la Grande Finale.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Nom */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nom de la saison</FormLabel>
                  <FormControl>
                    <Input className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet" placeholder="Ex : Saison Inaugurale 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Numéro de saison */}
            <FormField
              control={form.control}
              name="season_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de saison</FormLabel>
                  <FormControl>
                    <Input className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                      type="number"
                      min={1}
                      max={999}
                      step={1}
                      value={(field.value as number | string | undefined) ?? ''}
                      onChange={(e) => {
                        const v = e.target.valueAsNumber
                        field.onChange(Number.isNaN(v) ? undefined : v)
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>Unique, ex : 1, 2, 3…</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre de tournois attendus */}
            <FormField
              control={form.control}
              name="expected_tournaments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournois prévus</FormLabel>
                  <FormControl>
                    <Input className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                      type="number"
                      min={1}
                      max={52}
                      step={1}
                      value={(field.value as number | string | undefined) ?? ''}
                      onChange={(e) => {
                        const v = e.target.valueAsNumber
                        field.onChange(Number.isNaN(v) ? undefined : v)
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Indicatif (affichage progression).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date de début */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de début</FormLabel>
                  <FormControl>
                    <Input className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date de fin */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de fin</FormLabel>
                  <FormControl>
                    <Input className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seuil de qualification */}
            <FormField
              control={form.control}
              name="qualification_threshold"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Seuil de qualification (points)</FormLabel>
                  <FormControl>
                    <Input className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                      type="number"
                      min={1}
                      max={100000}
                      step={1}
                      value={(field.value as number | string | undefined) ?? ''}
                      onChange={(e) => {
                        const v = e.target.valueAsNumber
                        field.onChange(Number.isNaN(v) ? undefined : v)
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Points minimum à cumuler dans la saison pour accéder à la
                    Grande Finale.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description (facultatif)</FormLabel>
                  <FormControl>
                    <Input className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                      placeholder="Quelques mots sur cette saison…"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ─── Footer actions ───────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isPending} aria-busy={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Création…
              </>
            ) : (
              'Créer la saison'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}