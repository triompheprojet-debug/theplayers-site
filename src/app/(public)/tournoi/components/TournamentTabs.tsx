'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

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
 * Onglets en pilules (maquette). On garde la primitive shadcn (Radix, a11y)
 * et on surcharge ses classes par défaut via twMerge — y compris les variantes
 * dark: — pour : inactif surface-2 / actif surface-3 + texte violet.
 */
const LIST = cn(
  'h-auto w-full justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-0',
  'group-data-[orientation=horizontal]/tabs:h-auto',
)

const TRIGGER = cn(
  'flex-none rounded-full bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary',
  'hover:text-text-primary',
  'data-[state=active]:bg-surface-3 data-[state=active]:text-accent-violet',
  'dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-surface-3 dark:data-[state=active]:text-accent-violet',
)

export function TournamentTabs({ tournamentType, config }: TournamentTabsProps) {
  return (
    <Tabs defaultValue="format" className="w-full">
      <TabsList className={LIST}>
        <TabsTrigger value="format" className={TRIGGER}>
          Format
        </TabsTrigger>
        <TabsTrigger value="rules" className={TRIGGER}>
          Règlement
        </TabsTrigger>
        <TabsTrigger value="schedule" className={TRIGGER}>
          Programme
        </TabsTrigger>
        <TabsTrigger value="faq" className={TRIGGER}>
          FAQ
        </TabsTrigger>
      </TabsList>

      <TabsContent value="format" className="pt-6">
        <FormatTab game={config.game} match={config.match} />
      </TabsContent>
      <TabsContent value="rules" className="pt-6">
        <RulesTab rules={config.rules} />
      </TabsContent>
      <TabsContent value="schedule" className="pt-6">
        <ScheduleTab schedule={config.schedule} />
      </TabsContent>
      <TabsContent value="faq" className="pt-6">
        <FAQTab tournamentType={tournamentType} registration={config.registration} />
      </TabsContent>
    </Tabs>
  )
}