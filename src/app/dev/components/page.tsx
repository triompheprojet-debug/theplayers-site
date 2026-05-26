'use client'

import { notFound } from 'next/navigation'
import { useState } from 'react'
import { Trophy, Users, Sparkles } from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

// Custom icons
import { BronzeIcon } from '@/components/icons/RankIcons/BronzeIcon'
import { SilverIcon } from '@/components/icons/RankIcons/SilverIcon'
import { GoldIcon } from '@/components/icons/RankIcons/GoldIcon'
import { DiamondIcon } from '@/components/icons/RankIcons/DiamondIcon'
import { LegendIcon } from '@/components/icons/RankIcons/LegendIcon'
import { MTNIcon } from '@/components/icons/MTNIcon'
import { AirtelIcon } from '@/components/icons/AirtelIcon'
import { PlayStationIcon } from '@/components/icons/PlayStationIcon'
import { EAFCBadge } from '@/components/icons/EAFCBadge'

// Shared
import { BrandLogo } from '@/components/shared/BrandLogo'
import { FCFA } from '@/components/shared/FCFA'
import { DateBadge } from '@/components/shared/DateBadge'
import { PlayerPseudo } from '@/components/shared/PlayerPseudo'
import { TournamentTypeBadge } from '@/components/shared/TournamentTypeBadge'
import { RankBadge } from '@/components/shared/RankBadge'
import { PaymentMethodIcon } from '@/components/shared/PaymentMethodIcon'
import { ConfidentialNotice } from '@/components/shared/ConfidentialNotice'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { ScrollableTabs } from '@/components/shared/ScrollableTabs'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Page de démo des composants — accessible uniquement en développement.
// Sera renvoyée en 404 automatiquement en production.
// ---------------------------------------------------------------------------

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  // États stabilisés (évite les warnings React 19 d'impureté)
  const [activeTab, setActiveTab] = useState('all')
  const [longTarget] = useState(
    () => new Date(Date.now() + 2 * 86_400_000 + 14_400_000),
  )
  const [shortTarget] = useState(() => new Date(Date.now() + 90_000))
  const [expiredTarget] = useState(() => new Date(Date.now() - 1000))

  return (
    <div className="min-h-screen">
      {/* Header sticky */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-surface-3">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="small" />
            <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
              Dev only
            </Badge>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-xs uppercase tracking-wider font-semibold">
            <a href="#shadcn" className="text-text-secondary hover:text-text-primary transition-colors">
              shadcn/ui
            </a>
            <a href="#icons" className="text-text-secondary hover:text-text-primary transition-colors">
              Icônes
            </a>
            <a href="#identity" className="text-text-secondary hover:text-text-primary transition-colors">
              Identitaires
            </a>
            <a href="#utilities" className="text-text-secondary hover:text-text-primary transition-colors">
              Utilitaires
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-12">
        {/* Intro */}
        <section>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Galerie de composants
          </h1>
          <p className="text-text-secondary">
            Vérification visuelle de l&apos;ensemble des composants UI du projet
            (M01 — UI Base).
          </p>
        </section>

        {/* ============================================================ */}
        {/* Section A : shadcn/ui                                         */}
        {/* ============================================================ */}
        <Section id="shadcn" title="shadcn/ui — composants de base">
          <Sub title="Button — variantes">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Sub>

          <Sub title="Alert">
            <div className="flex flex-col gap-3">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Inscription confirmée</AlertTitle>
                <AlertDescription>
                  Ton paiement a été vérifié. Rendez-vous samedi à 9h.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Paiement refusé</AlertTitle>
                <AlertDescription>
                  La transaction n&apos;a pas pu être vérifiée. Recommence.
                </AlertDescription>
              </Alert>
            </div>
          </Sub>

          <Sub title="Badge">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Sub>

          <Sub title="Card">
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle>Tournoi Hors Saison</CardTitle>
                <CardDescription>13-14 juin 2026 · Pointe-Noire</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Inscriptions ouvertes jusqu&apos;au 10 juin.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">S&apos;inscrire</Button>
              </CardFooter>
            </Card>
          </Sub>

          <Sub title="Input + Label">
            <div className="flex flex-col gap-2 max-w-sm">
              <Label htmlFor="pseudo-demo">Pseudo</Label>
              <Input id="pseudo-demo" placeholder="ex : zoro_242" />
              <Input placeholder="Disabled" disabled />
            </div>
          </Sub>

          <Sub title="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Ouvrir une modale</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer l&apos;annulation</DialogTitle>
                  <DialogDescription>
                    Cette action annulera ton inscription. Le paiement n&apos;est
                    pas remboursable (Règle 9).
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost">Retour</Button>
                  <Button variant="destructive">Confirmer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Sub>

          <Sub title="Skeleton + Separator">
            <div className="flex flex-col gap-4 max-w-md">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Separator />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </Sub>
        </Section>

        {/* ============================================================ */}
        {/* Section B : Icônes custom                                     */}
        {/* ============================================================ */}
        <Section id="icons" title="Icônes custom">
          <Sub title="Rangs (Bronze → Légende)">
            <div className="flex flex-wrap items-center gap-8">
              <BronzeIcon className="w-12 h-12" />
              <SilverIcon className="w-12 h-12" />
              <GoldIcon className="w-12 h-12" />
              <DiamondIcon className="w-12 h-12" />
              <LegendIcon className="w-12 h-12" />
            </div>
            <p className="text-xs text-text-muted mt-3">
              Tailles : 24px (par défaut), 48px (page profil)
            </p>
          </Sub>

          <Sub title="Opérateurs & plateformes">
            <div className="flex flex-wrap items-center gap-6">
              <MTNIcon className="w-12 h-12" />
              <AirtelIcon className="w-12 h-12" />
              <PlayStationIcon className="w-12 h-12 text-text-secondary" />
              <EAFCBadge className="w-16 h-12 text-text-primary" />
            </div>
          </Sub>
        </Section>

        {/* ============================================================ */}
        {/* Section C : Shared — Identitaires                             */}
        {/* ============================================================ */}
        <Section id="identity" title="Shared — composants identitaires">
          <Sub title="BrandLogo — variantes">
            <div className="flex flex-wrap items-center gap-8">
              <BrandLogo />
              <BrandLogo withText />
              <BrandLogo variant="small" />
              <BrandLogo variant="white" />
            </div>
          </Sub>

          <Sub title="FCFA">
            <div className="flex flex-wrap items-center gap-6">
              <FCFA amount={3500} />
              <FCFA amount={100000} large />
              <FCFA amount={100000} neon large />
              <FCFA amount={3500} short />
            </div>
          </Sub>

          <Sub title="DateBadge">
            <div className="flex flex-col gap-1">
              <DateBadge from="2026-06-13" to="2026-06-14" />
              <DateBadge from="2026-06-30" to="2026-07-01" />
              <DateBadge date="2026-07-25" />
              <DateBadge date="2026-08-15" withTime="14:00" />
            </div>
          </Sub>

          <Sub title="PlayerPseudo — tailles">
            <div className="flex flex-col gap-3">
              <PlayerPseudo pseudo="zoro_242" size="xs" />
              <PlayerPseudo pseudo="zoro_242" size="sm" withPrefix />
              <PlayerPseudo pseudo="zoro_242" size="md" />
              <PlayerPseudo pseudo="zoro_242" size="lg" />
              <PlayerPseudo pseudo="zoro_242" size="xl" />
            </div>
          </Sub>

          <Sub title="TournamentTypeBadge">
            <div className="flex flex-wrap items-center gap-3">
              <TournamentTypeBadge type="off_season" />
              <TournamentTypeBadge type="season" />
              <TournamentTypeBadge type="grand_final" />
            </div>
          </Sub>

          <Sub title="RankBadge">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-6">
                <RankBadge rank="bronze" />
                <RankBadge rank="silver" />
                <RankBadge rank="gold" />
                <RankBadge rank="diamond" />
                <RankBadge rank="legend" />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <RankBadge rank="bronze" withLabel />
                <RankBadge rank="silver" withLabel />
                <RankBadge rank="gold" withLabel />
                <RankBadge rank="diamond" withLabel />
                <RankBadge rank="legend" withLabel />
              </div>
              <div>
                <RankBadge rank="legend" withLabel size="lg" />
              </div>
            </div>
          </Sub>
        </Section>

        {/* ============================================================ */}
        {/* Section D : Shared — Utilitaires                              */}
        {/* ============================================================ */}
        <Section id="utilities" title="Shared — composants utilitaires">
          <Sub title="PaymentMethodIcon">
            <div className="flex items-center gap-6">
              <PaymentMethodIcon method="mtn_mobile_money" />
              <PaymentMethodIcon method="airtel_money" />
              <PaymentMethodIcon method="cash" />
              <PaymentMethodIcon method="mtn_mobile_money" size="lg" />
            </div>
          </Sub>

          <Sub title="ConfidentialNotice">
            <ConfidentialNotice />
          </Sub>

          <Sub title="EmptyState">
            <EmptyState
              icon={Trophy}
              title="Aucun tournoi actif"
              description="Le prochain tournoi démarrera bientôt. Reste connecté."
              action={<Button>Voir l&apos;historique</Button>}
            />
          </Sub>

          <Sub title="ErrorState">
            <ErrorState onRetry={() => alert('Retry')} />
          </Sub>

          <Sub title="LoadingSpinner — tailles">
            <div className="flex items-center gap-6">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
              <LoadingSpinner size="xl" />
              <LoadingSpinner size="md" className="text-success-neon" />
            </div>
          </Sub>

          <Sub title="CountdownTimer">
            <div className="flex flex-col gap-2 text-2xl">
              <CountdownTimer targetDate={longTarget} />
              <CountdownTimer targetDate={shortTarget} />
              <CountdownTimer targetDate={expiredTarget} />
            </div>
          </Sub>

          <Sub title="ScrollableTabs">
            <ScrollableTabs
              tabs={[
                { id: 'all', label: 'Tous' },
                { id: 'pending', label: 'En attente', badge: 3 },
                { id: 'confirmed', label: 'Confirmés', badge: 42 },
                { id: 'rejected', label: 'Rejetés' },
                { id: 'cancelled', label: 'Annulés' },
                { id: 'expired', label: 'Expirés' },
                { id: 'manual', label: 'Manuels' },
              ]}
              activeId={activeTab}
              onChange={setActiveTab}
            />
            <p className="text-xs text-text-muted mt-2">
              Onglet actif :{' '}
              <span className="text-accent-violet font-semibold">{activeTab}</span>
            </p>
          </Sub>

          <Sub title="Inscription mockée (mise en situation)">
            <Card className="max-w-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-text-muted" />
                    <div>
                      <PlayerPseudo pseudo="zoro_242" size="md" />
                      <p className="text-xs text-text-muted">Inscription #042</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <span className="text-warning">En attente</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Méthode</span>
                  <div className="flex items-center gap-2">
                    <PaymentMethodIcon method="mtn_mobile_money" size="sm" />
                    <span>MTN Mobile Money</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Montant</span>
                  <FCFA amount={3500} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Rang actuel</span>
                  <RankBadge rank="gold" withLabel size="sm" />
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="ghost" size="sm" className="flex-1">
                  Refuser
                </Button>
                <Button size="sm" className="flex-1">
                  Confirmer
                </Button>
              </CardFooter>
            </Card>
          </Sub>
        </Section>

        <footer className="text-center text-xs text-text-muted py-12 border-t border-surface-3">
          THE PLAYERS — Galerie de composants (dev only) · M01 OK
        </footer>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers de structure (composants locaux)
// ---------------------------------------------------------------------------

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
    return (
        <section id={id} className="scroll-mt-20 flex flex-col gap-6">
        <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            
            {/* CORRECTION : Ajout de la balise <a> ouvrante */}
            <a 
            href={`#${id}`}
            className="text-xs text-text-muted hover:text-accent-violet"
            >
            #
            </a>
        </div>
        <div className="flex flex-col gap-6">{children}</div>
        </section>
    )
}

function Sub({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-3 p-6 rounded-xl bg-surface-1')}>
      <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
        {title}
      </h3>
      {children}
    </div>
  )
}