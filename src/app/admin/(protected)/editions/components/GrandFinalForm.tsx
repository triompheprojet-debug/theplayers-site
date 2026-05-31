'use client'

/**
 * Formulaire de création d'un tournoi Hors Saison (M03.E).
 *
 * Architecture :
 *  - react-hook-form + zodResolver(grandFinalCreateSchema)
 *  - Pré-rempli depuis tournament_defaults + event_location (props typées)
 *  - 9 sections (Card) sur une seule page scrollable
 *  - Layout 2 colonnes sur desktop (grid md:grid-cols-2)
 *
 * Sous-composants NumberField / TimeField : génériques pour éviter
 *  - Sous-composants NumberField / TimeField typés sur FormInput pour
 *    éviter les erreurs de variance sur le Control.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm, type FieldPath, type UseFormReturn } from 'react-hook-form'
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
import { grandFinalCreateSchema } from '@/lib/validation/tournament'
import type {
  EventLocation,
  TournamentDefaults,
} from '@/types/config.types'

import { createGrandFinalAction } from '../saisons/[id]/grande-finale/nouvelle/actions'

// ===========================================================================
// Types
// ===========================================================================
// IMPORTANT : avec z.coerce.number() (Zod 4), l'INPUT du schéma diffère de
// l'OUTPUT — les champs coercés sont `unknown` en entrée et `number` en sortie.
// On distingue donc FormInput (ce que manipule react-hook-form pendant la
// saisie) et FormOutput (ce que renvoie la validation au submit).
// Voir : https://github.com/react-hook-form/resolvers (section "Force the output type").
type FormInput = z.input<typeof grandFinalCreateSchema>
type FormOutput = z.output<typeof grandFinalCreateSchema>

interface GrandFinalFormProps {
  seasonId: string
  defaults: TournamentDefaults | null
  eventLocation: EventLocation | null
}

// ===========================================================================
// Builder des valeurs initiales depuis tournament_defaults
// ===========================================================================

/**
 * Lit les defaults app_config (typés) et construit des valeurs initiales
 * valides pour grandFinalCreateSchema. Tolérant aux defaults absents.
 */
function buildInitialValues(
  seasonId: string,
  defaults: TournamentDefaults | null,
  eventLocation: EventLocation | null,
): FormInput {
  return {
    name: '',
    season_id: seasonId,
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
export function GrandFinalForm({
  seasonId,
  defaults,
  eventLocation,
}: GrandFinalFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(grandFinalCreateSchema),
    defaultValues: buildInitialValues(seasonId, defaults, eventLocation),
    mode: 'onBlur',
  })

  const onSubmit = (values: FormOutput) => {
    startTransition(async () => {
      const result = await createGrandFinalAction(values)
      if (result.success) {
        toast.success('Grande Finale créée.')
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
        {/* ─── 1. Identité ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
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
                      type="number"
                      min={1}
                      max={1024}
                      step={1}
                      value={(field.value as number | string | undefined) ?? ''}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
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

        {/* ─── 2. Dates ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
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
                    <Input type="date" {...field} />
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
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Souvent le dimanche suivant.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ─── 3. Jeu ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Jeu</CardTitle>
            <CardDescription>
              Plateforme et niveau de difficulté.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="config.game.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du jeu</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                      <SelectTrigger className="w-full">
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
                      <SelectTrigger className="w-full">
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

        {/* ─── 4. Match ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Format des matchs</CardTitle>
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

        {/* ─── 5. Règles ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Règles de discipline</CardTitle>
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

        {/* ─── 6. Inscriptions et prix ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Inscriptions, prix et consoles</CardTitle>
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

        {/* ─── 7. Horaires ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Horaires de l&apos;événement</CardTitle>
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

        {/* ─── 8. Paiement Mobile Money ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées Mobile Money</CardTitle>
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
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ─── 9. Lieu ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Lieu de l&apos;événement</CardTitle>
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ─── Footer actions ───────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-bg-primary py-4 border-t border-border">
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
// Sous-composants — NumberField & TimeField
// ===========================================================================
// Typés en dur sur FormInput (pas de génériques) pour éviter le bug
// "Two different types with this name exist" entre RHF 7.76 et Zod 4.4.
// Conséquence : ces helpers sont réservés à ce formulaire-ci.

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