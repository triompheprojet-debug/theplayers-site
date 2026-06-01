'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { FAQTab } from './FAQTab'
import { FormatTab } from './FormatTab'
import { RulesTab } from './RulesTab'
import { ScheduleTab } from './ScheduleTab'
import type { PublicTournamentConfig } from './config'

interface TournamentTabsProps {
  tournamentType: 'off_season' | 'season' | 'grand_final'
  config: PublicTournamentConfig
}

/**
 * Conteneur d'onglets de la page Tournoi (M05).
 *
 * Client Component (état d'onglet géré par Radix). Les onglets eux-mêmes sont
 * des Server Components dont le rendu est passé en children (RSC dans un
 * Client wrapper) — pas de logique de données ici, uniquement la navigation.
 */
export function TournamentTabs({ tournamentType, config }: TournamentTabsProps) {
  return (
    <Tabs defaultValue="format" className="w-full">
      <TabsList variant="line" className="w-full overflow-x-auto">
        <TabsTrigger value="format">Format</TabsTrigger>
        <TabsTrigger value="rules">Règlement</TabsTrigger>
        <TabsTrigger value="schedule">Programme</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>

      <TabsContent value="format" className="pt-4">
        <FormatTab
          game={config.game}
          match={config.match}
          consoles={config.consoles}
        />
      </TabsContent>

      <TabsContent value="rules" className="pt-4">
        <RulesTab rules={config.rules} />
      </TabsContent>

      <TabsContent value="schedule" className="pt-4">
        <ScheduleTab schedule={config.schedule} />
      </TabsContent>

      <TabsContent value="faq" className="pt-4">
        <FAQTab tournamentType={tournamentType} registration={config.registration} />
      </TabsContent>
    </Tabs>
  )
}