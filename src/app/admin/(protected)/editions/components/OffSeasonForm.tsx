'use client'

/**
 * Formulaire de création d'un tournoi Hors Saison (M03.E) — refonte : onglets.
 *
 *  - react-hook-form + zodResolver(offSeasonCreateSchema) — INCHANGÉ.
 *  - 9 sections regroupées en 4 onglets. Tous les panneaux sont forceMount
 *    (champs toujours montés) → validation/submit RHF intacts.
 *  - Pastille d'erreur par onglet + bascule auto sur le 1er onglet en erreur.
 *  - Pré-rempli depuis tournament_defaults + event_location (props typées).
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  useForm,
  type FieldErrors,
  type FieldPath,
  type UseFormReturn,
} from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { ConfidentialNotice } from '@/components/shared/ConfidentialNotice'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { offSeasonCreateSchema } from '@/lib/validation/tournament'
import type { EventLocation, TournamentDefaults } from '@/types/config.types'
import { createOffSeasonAction } from '../hors-saison/nouvelle/actions'

// ===========================================================================
// Types
// ===========================================================================
type FormInput = z.input<typeof offSeasonCreateSchema>
type FormOutput = z.output<typeof offSeasonCreateSchema>

interface OffSeasonFormProps {
  defaults: TournamentDefaults | null
  eventLocation: EventLocation | null
}

// ===========================================================================
// Onglets — regroupement des sections + champs (pour pastille d'erreur)
// ===========================================================================
const TABS = [
  {
    value: 'general',
    label: 'Général',
    fields: ['name', 'capacity', 'start_date', 'end_date'],
  },
  {
    value: 'jeu',
    label: 'Jeu & règles',
    fields: [
      'config.game.name',
      'config.game.platform',
      'config.game.difficulty',
      'config.match.duration_minutes',
      'config.match.half_minutes',
      'config.match.break_minutes',
      'config.rules.late_minutes',
      'config.rules.claim_minutes',
      'config.rules.ban_tournaments',
    ],
  },
  {
    value: 'inscriptions',
    label: 'Inscriptions',
    fields: [
      'config.registration.amount_fcfa',
      'config.consoles.active_count',
      'config.prizes.first_fcfa',
      'config.prizes.second_fcfa',
    ],
  },
  {
    value: 'logistique',
    label: 'Logistique',
    fields: [
      'config.schedule.saturday_arrival',
      'config.schedule.saturday_briefing',
      'config.schedule.sunday_arrival',
      'config.schedule.ceremony_time',
      'config.payment.mtn_number',
      'config.payment.mtn_holder_name',
      'config.payment.airtel_number',
      'config.payment.airtel_holder_name',
      'config.location.address',
      'config.location.maps_url',
      'config.location.city',
      'config.location.country',
    ],
  },
] as const

function hasNestedError(errors: unknown, path: string): boolean {
  let cur: unknown = errors
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return false
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur != null
}

// ===========================================================================
// Valeurs initiales depuis tournament_defaults
// ===========================================================================
function buildInitialValues(
  defaults: TournamentDefaults | null,
  eventLocation: EventLocation | null,
): FormInput {
  return {
    name: '',
    start_date: '',
    end_date: '',
    capacity: 32,
    registration_opens_at: null,
    registration_closes_at: null,
    config: {
      game: {
        name: defaults?.game.name ?? '',
        platform: defaults?.game.platform ?? '',
        difficulty: defaults?.game.difficulty ?? '',
      },
      match: {
        duration_minutes: defaults?.match.duration_minutes ?? 14,
        half_minutes: defaults?.match.half_minutes ?? 6,
        break_minutes: defaults?.match.break_minutes ?? 2,
      },
      rules: {
        late_minutes: defaults?.rules.late_minutes ?? 5,
        claim_minutes: defaults?.rules.claim_minutes ?? 2,
        ban_tournaments: defaults?.rules.ban_tournaments ?? 3,
      },
      registration: {
        amount_fcfa: defaults?.registration.amount_fcfa ?? 0,
      },
      prizes: {
        first_fcfa: defaults?.prizes.first_fcfa ?? 0,
        second_fcfa: defaults?.prizes.second_fcfa ?? 0,
      },
      consoles: {
        active_count: defaults?.consoles.active_count ?? 1,
      },
      schedule: {
        saturday_arrival: defaults?.schedule.saturday_arrival ?? '08:00',
        saturday_briefing: defaults?.schedule.saturday_briefing ?? '08:30',
        sunday_arrival: defaults?.schedule.sunday_arrival ?? '08:00',
        ceremony_time: defaults?.schedule.ceremony_time ?? '20:00',
      },
      payment: {
        mtn_number: defaults?.payment.mtn_number ?? '',
        mtn_holder_name: defaults?.payment.mtn_holder_name ?? '',
        airtel_number: defaults?.payment.airtel_number ?? '',
        airtel_holder_name: defaults?.payment.airtel_holder_name ?? '',
      },
      location: {
        address: eventLocation?.address ?? '',
        maps_url: eventLocation?.maps_url ?? '',
        city: eventLocation?.city ?? 'Pointe-Noire',
        country: eventLocation?.country ?? 'République du Congo',
      },
    },
  } as FormInput
}

// ===========================================================================
// Composant principal
// ===========================================================================
export function OffSeasonForm({ defaults, eventLocation }: OffSeasonFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<string>('general')

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(offSeasonCreateSchema),
    defaultValues: buildInitialValues(defaults, eventLocation),
    mode: 'onBlur',
  })

  const errors = form.formState.errors

  const onSubmit = (values: FormOutput) => {
    startTransition(async () => {
      const result = await createOffSeasonAction(values)
      if (result.success) {
        toast.success('Tournoi Hors Saison créé.')
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

  // Bascule sur le 1er onglet contenant une erreur de validation
  const onInvalid = (errs: FieldErrors<FormInput>) => {
    const tab = TABS.find((t) => t.fields.some((f) => hasNestedError(errs, f)))
    if (tab) setActiveTab(tab.value)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6"
        noValidate
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
            {TABS.map((t) => {
              const err = t.fields.some((f) => hasNestedError(errors, f))
              return (
                <TabsTrigger key={t.value} value={t.value} className="relative">
                  {t.label}
                  {err && (
                    <span
                      className="ml-1.5 inline-block size-1.5 rounded-full bg-danger"
                      aria-label="Cet onglet contient des erreurs"
                    />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* ═══ Onglet 1 — Général (Identité + Dates) ═══════════════════ */}
          <TabsContent value="general" forceMount className="mt-0 space-y-6">
            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">Identité</CardTitle>
                <CardDescription>
                  Nom public du tournoi et capacité d&apos;accueil.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nom du tournoi</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          placeholder="Ex : Coupe Inaugurale de Pointe-Noire"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Capacité (nombre de joueurs)</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          type="number"
                          min={1}
                          max={1024}
                          step={1}
                          value={
                            (field.value as number | string | undefined) ?? ''
                          }
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Information confidentielle — visible admin uniquement.
                      </FormDescription>
                      <FormMessage />
                      <ConfidentialNotice className="mt-2" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">Dates</CardTitle>
                <CardDescription>
                  Période durant laquelle se déroule le tournoi.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Idéalement un samedi pour les tournois Hors Saison.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Souvent le dimanche suivant.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Onglet 2 — Jeu & règles (Jeu + Match + Règles) ══════════ */}
          <TabsContent value="jeu" forceMount className="mt-0 space-y-6">
            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">Jeu</CardTitle>
                <CardDescription>Plateforme et niveau de difficulté.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="config.game.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du jeu</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.game.platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plateforme</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full border-0 bg-surface-2 focus:ring-1 focus:ring-accent-violet">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PS4/PS5">PS4/PS5</SelectItem>
                          <SelectItem value="PS4">PS4</SelectItem>
                          <SelectItem value="PS5">PS5</SelectItem>
                          <SelectItem value="Xbox">Xbox</SelectItem>
                          <SelectItem value="PC">PC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.game.difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulté</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full border-0 bg-surface-2 focus:ring-1 focus:ring-accent-violet">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DEBUTANT">Débutant</SelectItem>
                          <SelectItem value="AMATEUR">Amateur</SelectItem>
                          <SelectItem value="SEMI-PRO">Semi-pro</SelectItem>
                          <SelectItem value="LEGENDAIRE">Légendaire</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">
                  Format des matchs
                </CardTitle>
                <CardDescription>
                  Durée totale = (mi-temps × 2) + pause.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <NumberField
                  control={form.control}
                  name="config.match.duration_minutes"
                  label="Durée totale (min)"
                  min={1}
                  max={120}
                />
                <NumberField
                  control={form.control}
                  name="config.match.half_minutes"
                  label="Mi-temps (min)"
                  min={1}
                  max={60}
                />
                <NumberField
                  control={form.control}
                  name="config.match.break_minutes"
                  label="Pause (min)"
                  min={0}
                  max={30}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">
                  Règles de discipline
                </CardTitle>
                <CardDescription>
                  Délais et sanctions appliqués pendant le tournoi.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <NumberField
                  control={form.control}
                  name="config.rules.late_minutes"
                  label="Retard toléré (min)"
                  min={0}
                  max={60}
                />
                <NumberField
                  control={form.control}
                  name="config.rules.claim_minutes"
                  label="Délai de réclamation (min)"
                  min={0}
                  max={60}
                />
                <NumberField
                  control={form.control}
                  name="config.rules.ban_tournaments"
                  label="Bannissement (tournois)"
                  min={0}
                  max={20}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Onglet 3 — Inscriptions, prix et consoles ══════════════ */}
          <TabsContent value="inscriptions" forceMount className="mt-0 space-y-6">
            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">
                  Inscriptions, prix et consoles
                </CardTitle>
                <CardDescription>
                  Frais d&apos;entrée, cagnotte et nombre de consoles actives.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <NumberField
                  control={form.control}
                  name="config.registration.amount_fcfa"
                  label="Frais d'inscription (FCFA)"
                  min={1}
                  max={100_000_000}
                />
                <NumberField
                  control={form.control}
                  name="config.consoles.active_count"
                  label="Consoles actives"
                  min={1}
                  max={50}
                />
                <NumberField
                  control={form.control}
                  name="config.prizes.first_fcfa"
                  label="1er prix (FCFA)"
                  min={1}
                  max={100_000_000}
                />
                <NumberField
                  control={form.control}
                  name="config.prizes.second_fcfa"
                  label="2e prix (FCFA)"
                  min={0}
                  max={100_000_000}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Onglet 4 — Logistique (Horaires + Paiement + Lieu) ═════ */}
          <TabsContent value="logistique" forceMount className="mt-0 space-y-6">
            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">
                  Horaires de l&apos;événement
                </CardTitle>
                <CardDescription>
                  Heures d&apos;arrivée et cérémonie de clôture.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <TimeField
                  control={form.control}
                  name="config.schedule.saturday_arrival"
                  label="Arrivée samedi"
                />
                <TimeField
                  control={form.control}
                  name="config.schedule.saturday_briefing"
                  label="Briefing samedi"
                />
                <TimeField
                  control={form.control}
                  name="config.schedule.sunday_arrival"
                  label="Arrivée dimanche"
                />
                <TimeField
                  control={form.control}
                  name="config.schedule.ceremony_time"
                  label="Cérémonie de clôture"
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">
                  Coordonnées Mobile Money
                </CardTitle>
                <CardDescription>
                  Facultatif à la création (le tournoi reste en brouillon).
                  Devra être renseigné avant l&apos;ouverture des inscriptions.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="config.payment.mtn_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MTN Mobile Money — numéro</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          type="tel"
                          placeholder="+242 06 XX XX XX XX"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.payment.mtn_holder_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MTN — titulaire</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.payment.airtel_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airtel Money — numéro</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          type="tel"
                          placeholder="+242 06 XX XX XX XX"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.payment.airtel_holder_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airtel — titulaire</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 bg-surface-1 shadow-none">
              <CardHeader>
                <CardTitle className="text-accent-violet">
                  Lieu de l&apos;événement
                </CardTitle>
                <CardDescription>
                  Adresse, ville et lien Google Maps. Pré-rempli depuis la
                  configuration globale.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="config.location.address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.location.maps_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Lien Google Maps</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          type="url"
                          placeholder="https://maps.google.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="config.location.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl>
                        <Input
                          className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Footer actions (hors onglets, toujours visible) ────────── */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
              'Créer le tournoi'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// ===========================================================================
// Sous-composants — NumberField & TimeField (typés FormInput)
// ===========================================================================
interface NumberFieldProps {
  control: UseFormReturn<FormInput>['control']
  name: FieldPath<FormInput>
  label: string
  min?: number
  max?: number
}

function NumberField({ control, name, label, min, max }: NumberFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
              type="number"
              min={min}
              max={max}
              step={1}
              value={(field.value as number | string | undefined) ?? ''}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface TimeFieldProps {
  control: UseFormReturn<FormInput>['control']
  name: FieldPath<FormInput>
  label: string
}

function TimeField({ control, name, label }: TimeFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              className="border-0 bg-surface-2 focus-visible:ring-1 focus-visible:ring-accent-violet"
              type="time"
              value={(field.value as string | undefined) ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}