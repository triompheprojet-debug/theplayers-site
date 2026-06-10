/**
 * Métadonnées du site (SEO, branding).
 * Source unique de vérité — pas de duplication dans layout.tsx ou autres pages.
 */

export const SITE_CONFIG = {
  name: 'THE PLAYERS',
  fullName: 'THE PLAYERS — Liga Esport FC',
  shortName: 'The Players',
  description:
    'Tournois de football virtuel à Pointe-Noire, République du Congo. EA Sports FC, élimination directe, cash prizes.',
  keywords: [
    'esport',
    'football virtuel',
    'EA Sports FC',
    'Pointe-Noire',
    'Congo',
    'tournoi',
    'PlayStation',
    'Liga Esport FC',
  ],
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'fr_CG',
  defaultLanguage: 'fr',
  themeColor: '#0a0a14',
  ogImage: '/images/og-default.png', // à créer en M21
  author: {
    name: 'THE PLAYERS',
    location: 'Pointe-Noire, République du Congo',
  },
} as const

export type SiteConfig = typeof SITE_CONFIG