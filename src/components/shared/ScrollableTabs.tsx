'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

export interface ScrollableTab {
  id: string
  label: string
  /** Badge optionnel à droite du label (ex: "3" pour un compteur) */
  badge?: string | number
}

interface ScrollableTabsProps {
  tabs: ScrollableTab[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

/**
 * Onglets horizontaux scrollables — pattern mobile.
 *
 * - Scroll horizontal libre, scroll-snap optionnel via CSS
 * - L'onglet actif se centre automatiquement à l'écran lors du clic
 * - Accessibilité : role="tablist" + aria-selected
 *
 * Exemple :
 *   <ScrollableTabs
 *     tabs={[
 *       { id: 'all', label: 'Tous' },
 *       { id: 'pending', label: 'En attente', badge: 3 },
 *       { id: 'confirmed', label: 'Confirmés' },
 *     ]}
 *     activeId={activeTab}
 *     onChange={setActiveTab}
 *   />
 */
export function ScrollableTabs({
  tabs,
  activeId,
  onChange,
  className,
}: ScrollableTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Centre l'onglet actif au changement
  useEffect(() => {
    const activeEl = tabRefs.current.get(activeId)
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeId])

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-none',
        '-mx-4 px-4 py-2',                  // compense le padding parent
        '[scrollbar-none [-ms-overflow-style:none]',
        '[&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el)
              else tabRefs.current.delete(tab.id)
            }}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'shrink-0 min-h-10 px-4 py-2 rounded-full',
              'text-sm font-semibold whitespace-nowrap',
              'transition-colors duration-150',
              isActive
                ? 'bg-accent-violet text-text-on-accent'
                : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary',
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'ml-2 inline-flex items-center justify-center',
                  'min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold',
                  isActive
                    ? 'bg-text-on-accent/20 text-text-on-accent'
                    : 'bg-surface-3 text-text-primary',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}