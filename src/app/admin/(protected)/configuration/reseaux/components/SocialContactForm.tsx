'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPin, Phone, Plus, Save, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa6'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  socialContactSchema,
  type SocialContactFormValues,
} from '@/lib/validation/config'

import { updateSocialContactAction } from '../actions'

import type { IconType } from 'react-icons'

interface SocialContactFormProps {
  initialValues: SocialContactFormValues
}

const SOCIAL_FIELDS: {
  name: keyof SocialContactFormValues['social_links']
  label: string
  icon: IconType
  color: string
  placeholder: string
  mono?: boolean
}[] = [
  { name: 'facebook', label: 'Facebook', icon: FaFacebookF, color: '#1877f2', placeholder: 'https://facebook.com/votrepage' },
  { name: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#e1306c', placeholder: 'https://instagram.com/votrecompte' },
  { name: 'tiktok', label: 'TikTok', icon: FaTiktok, color: '#f4f4f5', placeholder: 'https://tiktok.com/@votrecompte' },
  { name: 'whatsapp_public', label: 'WhatsApp public', icon: FaWhatsapp, color: '#25d366', placeholder: '+242 06 000 0000', mono: true },
]

const EVENT_FIELDS: {
  name: keyof SocialContactFormValues['event_location']
  label: string
  placeholder: string
}[] = [
  { name: 'address', label: 'Adresse', placeholder: 'Salle…, quartier…' },
  { name: 'maps_url', label: 'Lien Google Maps', placeholder: 'https://maps.google.com/…' },
  { name: 'city', label: 'Ville', placeholder: 'Pointe-Noire' },
  { name: 'country', label: 'Pays', placeholder: 'République du Congo' },
]

export function SocialContactForm({ initialValues }: SocialContactFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SocialContactFormValues>({
    resolver: zodResolver(socialContactSchema),
    defaultValues: initialValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contact_phones',
  })

  const onSubmit = async (values: SocialContactFormValues) => {
    const res = await updateSocialContactAction(values)
    if (res.success) {
      toast.success('Réseaux et coordonnées enregistrés.')
      reset(values)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* ── Réseaux sociaux ─────────────────────────────────────────── */}
      <section className="rounded-2xl bg-surface-1 p-5 lg:p-6">
        <h2 className="text-base font-semibold text-text-primary">
          Réseaux sociaux
        </h2>
        <p className="mt-1 mb-5 text-xs text-text-muted">
          {'Laissez un champ vide pour masquer le réseau côté public.'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((f) => {
            const Icon = f.icon
            const err = errors.social_links?.[f.name]
            return (
              <div key={f.name} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {f.label}
                </label>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: f.color }}
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <Input
                    {...register(`social_links.${f.name}`)}
                    placeholder={f.placeholder}
                    inputMode={f.mono ? 'tel' : 'url'}
                    className={`pl-9 ${f.mono ? 'font-mono' : ''}`}
                  />
                </div>
                {err?.message && (
                  <p className="text-xs text-danger">{err.message}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Numéros de contact ──────────────────────────────────────── */}
      <section className="rounded-2xl bg-surface-1 p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <Phone className="size-4 text-accent-violet" aria-hidden />
          <h2 className="text-base font-semibold text-text-primary">
            Numéros de contact
          </h2>
        </div>
        <p className="mt-1 mb-4 text-xs text-text-muted">
          {'Affichés sur la page contact. Activez « WhatsApp » pour proposer un lien wa.me.'}
        </p>

        {fields.length === 0 && (
          <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-text-muted">
            {'Aucun numéro pour le moment.'}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const rowErr = errors.contact_phones?.[index]
            return (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-xl bg-surface-2 p-3 sm:flex-row sm:items-center"
              >
                <Input
                  {...register(`contact_phones.${index}.label`)}
                  placeholder="Libellé (ex : Support)"
                  className="bg-surface-3 sm:flex-1"
                />
                <Input
                  {...register(`contact_phones.${index}.number`)}
                  placeholder="+242 06 000 0000"
                  inputMode="tel"
                  className="bg-surface-3 font-mono sm:flex-1"
                />
                <div className="flex items-center justify-between gap-3 sm:justify-start">
                  <Controller
                    control={control}
                    name={`contact_phones.${index}.is_whatsapp`}
                    render={({ field: sw }) => (
                      <label className="flex cursor-pointer items-center gap-2">
                        <Switch
                          checked={sw.value}
                          onCheckedChange={sw.onChange}
                        />
                        <span className="text-xs text-text-secondary">
                          WhatsApp
                        </span>
                      </label>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label="Supprimer ce numéro"
                    className="text-text-muted hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {rowErr && (
                  <p className="text-xs text-danger sm:basis-full">
                    {rowErr.label?.message ?? rowErr.number?.message}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => append({ label: '', number: '', is_whatsapp: false })}
        >
          <Plus className="mr-2 size-4" />
          Ajouter un numéro
        </Button>
      </section>

      {/* ── Lieu de l'événement ─────────────────────────────────────── */}
      <section className="rounded-2xl bg-surface-1 p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-accent-violet" aria-hidden />
          <h2 className="text-base font-semibold text-text-primary">
            {"Lieu de l'événement"}
          </h2>
        </div>
        <p className="mt-1 mb-5 text-xs text-text-muted">
          {'Adresse par défaut affichée sur la page contact et reprise pour les tournois.'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {EVENT_FIELDS.map((f) => {
            const err = errors.event_location?.[f.name]
            return (
              <div key={f.name} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {f.label}
                </label>
                <Input
                  {...register(`event_location.${f.name}`)}
                  placeholder={f.placeholder}
                />
                {err?.message && (
                  <p className="text-xs text-danger">{err.message}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Barre d'action ──────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-3 bg-surface-1 px-6 py-4">
        <span className="text-xs text-text-muted">
          {isDirty ? 'Modifications non enregistrées' : 'À jour'}
        </span>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSubmitting}
            onClick={() => reset(initialValues)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>
    </form>
  )
}