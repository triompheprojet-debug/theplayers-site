'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface RecipientOption {
  id: string
  pseudo: string
}

interface RecipientSelectorProps {
  recipients: RecipientOption[]
  value: string
  onChange: (playerId: string) => void
  disabled?: boolean
}

/**
 * Selecteur de destinataire (envoi unitaire) : liste des joueurs du tournoi
 * actif. On n'expose que pseudo + id (jamais le telephone d'un autre joueur).
 */
export function RecipientSelector({
  recipients,
  value,
  onChange,
  disabled,
}: RecipientSelectorProps) {
  if (recipients.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Aucun joueur inscrit sur le tournoi actif pour le moment.
      </p>
    )
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Choisir un joueur" />
      </SelectTrigger>
      <SelectContent>
        {recipients.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.pseudo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}