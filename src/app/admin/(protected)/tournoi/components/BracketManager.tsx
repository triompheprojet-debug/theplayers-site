'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Info, Loader2, Shuffle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  drawBracketAction,
  publishBracketAction,
  unpublishBracketAction,
} from '../actions'
import { DrawConfirmModal } from './DrawConfirmModal'
import { BracketEditor } from './BracketEditor'
import { ScoreEntryModal } from './ScoreEntryModal'

import type { AdminBracketMatch, AdminBracketState } from '@/lib/bracket/read'

interface BracketManagerProps {
  tournamentId: string
  tournamentName: string
  initialBracket: AdminBracketState | null
}

export function BracketManager({
  tournamentId,
  tournamentName,
  initialBracket,
}: BracketManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [drawOpen, setDrawOpen] = useState(false)
  const [scoreMatch, setScoreMatch] = useState<AdminBracketMatch | null>(null)

  const bracket = initialBracket
  const hasBracket = bracket?.hasBracket ?? false
  const isPublished = bracket?.bracketVisibility === 'published'

  const eligibleCount = useMemo(() => {
    // Compte indicatif des joueurs présents au round 1 (affichage modal).
    if (!bracket) return 0
    const ids = new Set<string>()
    for (const m of bracket.matches) {
      if (m.roundNumber !== 1) continue
      if (m.playerAId) ids.add(m.playerAId)
      if (m.playerBId) ids.add(m.playerBId)
    }
    return ids.size
  }, [bracket])

  function handleDrawConfirmed() {
    startTransition(async () => {
      const result = await drawBracketAction(tournamentId)
      if (result.success) {
        toast.success(
          `Tirage effectué : ${result.data.playerCount} joueurs, ${result.data.matchCount} matchs.`,
        )
        setDrawOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishBracketAction(tournamentId)
      if (result.success) {
        if (result.data.alreadyPublished) {
          toast.info('Le bracket était déjà publié.')
        } else {
          toast.success(
            `Bracket publié. ${result.data.notifiedPlayers} joueur(s) notifié(s).`,
          )
        }
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishBracketAction(tournamentId)
      if (result.success) {
        toast.success('Bracket repassé en brouillon.')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* ─── En-tête ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-text-primary">
            Gestion du tournoi
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {tournamentName} — Bracket
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bascule d'état (lecture seule, reflète bracket_visibility) */}
          <div className="flex items-center rounded-lg bg-surface-2 p-1 text-xs font-semibold uppercase tracking-wider">
            <span
              className={cn(
                'rounded-md px-3 py-1.5 transition-colors',
                !isPublished
                  ? 'bg-surface-1 text-text-primary'
                  : 'text-text-muted',
              )}
            >
              Brouillon
            </span>
            <span
              className={cn(
                'rounded-md px-3 py-1.5 transition-colors',
                isPublished
                  ? 'bg-surface-1 text-text-primary'
                  : 'text-text-muted',
              )}
            >
              Publié
            </span>
          </div>

          {hasBracket && (
            <Button
              variant="secondary"
              size="sm"
              disabled
              title="Export à venir"
              aria-label="Exporter le bracket"
            >
              <Download className="size-4" aria-hidden />
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setDrawOpen(true)}
            disabled={isPending || hasBracket}
            title={
              hasBracket
                ? 'Le tirage a déjà été effectué'
                : 'Lancer le tirage au sort'
            }
          >
            <Shuffle className="size-4" aria-hidden />
            Tirage au sort automatique
          </Button>
        </div>
      </div>

      {/* ─── Bandeau d'état ───────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-1 px-5 py-3">
        <div className="flex items-center gap-2.5 text-sm text-text-secondary">
          <Info className="size-4 shrink-0" aria-hidden />
          {!hasBracket ? (
            <span>
              Aucun bracket. Lancez le tirage au sort pour générer les matchs à
              partir des joueurs confirmés.
            </span>
          ) : isPublished ? (
            <span>
              Bracket publié : visible par les joueurs et le public, mis à jour
              en temps réel.
            </span>
          ) : (
            <span>
              Bracket en cours de construction. Visible uniquement par les
              administrateurs.
            </span>
          )}
        </div>

        {hasBracket &&
          (isPublished ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnpublish}
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Repasser en brouillon
            </Button>
          ) : (
            <Button size="sm" onClick={handlePublish} disabled={isPending}>
              {isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Publier le bracket
            </Button>
          ))}
      </div>

      {/* ─── Bracket ──────────────────────────────────────────────────── */}
      <div className="mt-6">
        {hasBracket && bracket ? (
          <BracketEditor
            matches={bracket.matches}
            rounds={bracket.rounds}
            onEnterScore={(m) => setScoreMatch(m)}
          />
        ) : (
          <div className="rounded-2xl bg-surface-1 px-6 py-16 text-center">
            <Shuffle
              className="mx-auto size-8 text-text-muted"
              aria-hidden
            />
            <p className="mt-3 text-sm text-text-secondary">
              Le bracket apparaîtra ici après le tirage au sort.
            </p>
          </div>
        )}
      </div>

      {/* ─── Modales ──────────────────────────────────────────────────── */}
      <DrawConfirmModal
        open={drawOpen}
        onOpenChange={setDrawOpen}
        eligibleCount={eligibleCount}
        isPending={isPending}
        onConfirm={handleDrawConfirmed}
      />

      <ScoreEntryModal
        match={scoreMatch}
        onClose={() => setScoreMatch(null)}
        onDone={() => {
          setScoreMatch(null)
          router.refresh()
        }}
      />
    </div>
  )
}