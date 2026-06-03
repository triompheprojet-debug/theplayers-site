'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Filtres de la liste des inscriptions (M10).
 * Pilote les searchParams (`status`, `q`) de la page serveur via le routeur.
 */
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'reserved', label: 'Réservé' },
  { value: 'awaiting_verification', label: 'En vérification' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'cancelled', label: 'Annulé' },
]

export function RegistrationFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStatus = searchParams.get('status') ?? 'all'
  const currentQuery = searchParams.get('q') ?? ''

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') params.delete(key)
    else params.set(key, value)
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-56">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <Input
          type="search"
          defaultValue={currentQuery}
          placeholder="Rechercher un pseudo…"
          className="pl-9"
          onChange={(e) => updateParam('q', e.target.value.trim())}
          aria-label="Rechercher par pseudo"
        />
      </div>

      <Select
        value={currentStatus}
        onValueChange={(value) => updateParam('status', value)}
      >
        <SelectTrigger className="w-52" aria-label="Filtrer par statut">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <span className="text-xs text-text-secondary">Filtrage…</span>
      )}
    </div>
  )
}