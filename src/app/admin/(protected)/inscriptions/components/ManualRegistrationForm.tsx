'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, KeyRound, Loader2, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import {
  createManualRegistrationAction,
  searchPlayersAction,
  type PlayerSearchResult,
} from '../nouvelle/actions'

type Mode = 'existing' | 'new'

/**
 * Formulaire d'inscription manuelle sur place (M10).
 *
 * Deux modes :
 *  - Joueur existant : recherche par pseudo, sélection.
 *  - Nouveau joueur : création d'un compte walk-in (un mot de passe temporaire
 *    est renvoyé une fois pour communication au joueur).
 *
 * La validation détaillée est faite côté serveur ; les erreurs de champ
 * remontent ici. Statut final : confirmé (espèces sur place) → badge auto.
 */
export function ManualRegistrationForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<Mode>('existing')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Mode "existant"
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlayerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<PlayerSearchResult | null>(null)

  // Mode "nouveau"
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [phone, setPhone] = useState('')

  // Résultat de création (affiche le mot de passe temporaire si walk-in)
  const [credentials, setCredentials] = useState<{
    pseudo: string
    password: string
    redirectTo: string
  } | null>(null)

  // Recherche débouncée
  useEffect(() => {
    if (mode !== 'existing') return
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const result = await searchPlayersAction(term)
      setSearching(false)
      if (result.success) setResults(result.data)
    }, 350)
    return () => clearTimeout(timer)
  }, [query, mode])

  function err(field: string): string | undefined {
    return fieldErrors[field]?.[0]
  }

  function handleSubmit() {
    setFieldErrors({})

    const input =
      mode === 'existing'
        ? { mode: 'existing' as const, playerId: selected?.id ?? '' }
        : {
            mode: 'new' as const,
            firstName,
            lastName,
            pseudo: pseudo.trim(),
            phone: phone.trim(),
          }

    if (mode === 'existing' && !selected) {
      toast.error('Sélectionnez un joueur dans la liste.')
      return
    }

    startTransition(async () => {
      const result = await createManualRegistrationAction(input)
      if (result.success) {
        if (result.data.tempPassword) {
          // Walk-in : on affiche les identifiants avant de naviguer.
          setCredentials({
            pseudo: pseudo.trim(),
            password: result.data.tempPassword,
            redirectTo: result.data.redirectTo,
          })
          toast.success(
            `Compte créé et inscrit — badge n°${result.data.badgeNumber ?? '—'}.`,
          )
        } else {
          toast.success(
            `Joueur inscrit — badge n°${result.data.badgeNumber ?? '—'}.`,
          )
          router.push(result.data.redirectTo)
        }
      } else {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.error)
      }
    })
  }

  // Écran de confirmation des identifiants walk-in
  if (credentials) {
    return (
      <Alert>
        <KeyRound className="size-4" aria-hidden />
        <AlertTitle>Identifiants du nouveau joueur</AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-text-secondary">
            Communiquez ces identifiants au joueur. Le mot de passe temporaire
            ne sera plus affiché ensuite.
          </p>
          <div className="rounded-md bg-surface-2 p-3 font-mono text-sm">
            <p>
              Pseudo : <strong>{credentials.pseudo}</strong>
            </p>
            <p>
              Mot de passe : <strong>{credentials.password}</strong>
            </p>
          </div>
          <Button onClick={() => router.push(credentials.redirectTo)}>
            <Check className="size-4" aria-hidden />
            J’ai noté, continuer
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Sélecteur de mode ───────────────────────────────────────── */}
      <div className="inline-flex rounded-lg border border-border bg-surface-1 p-1">
        <ModeButton
          active={mode === 'existing'}
          onClick={() => setMode('existing')}
          icon={Search}
          label="Joueur existant"
        />
        <ModeButton
          active={mode === 'new'}
          onClick={() => setMode('new')}
          icon={UserPlus}
          label="Nouveau joueur"
        />
      </div>

      {mode === 'existing' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="player-search">Rechercher par pseudo</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <Input
                id="player-search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelected(null)
                }}
                placeholder="Au moins 2 caractères…"
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </div>

          {searching && (
            <p className="text-xs text-text-secondary">Recherche…</p>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-text-secondary">
              Aucun joueur trouvé. Utilisez « Nouveau joueur » pour créer un
              compte.
            </p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {results.map((player) => (
                <li key={player.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(player)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-left',
                      'hover:bg-surface-1 transition-colors',
                      selected?.id === player.id && 'bg-accent-violet/10',
                    )}
                  >
                    <span>
                      <PlayerPseudo pseudo={player.pseudo} size="xs" />
                      {(player.firstName || player.lastName) && (
                        <span className="ml-2 text-xs text-text-secondary">
                          {[player.firstName, player.lastName]
                            .filter(Boolean)
                            .join(' ')}
                        </span>
                      )}
                    </span>
                    {selected?.id === player.id && (
                      <Check
                        className="size-4 text-accent-violet"
                        aria-hidden
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="firstName"
            label="Prénom"
            value={firstName}
            onChange={setFirstName}
            error={err('firstName')}
          />
          <TextField
            id="lastName"
            label="Nom"
            value={lastName}
            onChange={setLastName}
            error={err('lastName')}
          />
          <TextField
            id="pseudo"
            label="Pseudo"
            value={pseudo}
            onChange={setPseudo}
            error={err('pseudo')}
            hint="3 à 30 caractères : lettres, chiffres, - et _"
          />
          <TextField
            id="phone"
            label="Téléphone"
            value={phone}
            onChange={setPhone}
            error={err('phone')}
            hint="Utilisé pour la communication WhatsApp"
            type="tel"
          />
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Inscrire (espèces sur place)
        </Button>
        <p className="text-xs text-text-secondary">
          L’inscription sera confirmée immédiatement et un badge attribué.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Search
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-accent-violet/15 text-accent-violet'
          : 'text-text-secondary hover:text-text-primary',
      )}
      aria-pressed={active}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-secondary">{hint}</p>
      ) : null}
    </div>
  )
}