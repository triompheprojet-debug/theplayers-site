import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/config/site'

/**
 * sitemap.xml généré dynamiquement.
 * Liste les pages PUBLIQUES indexables. URL prise depuis NEXT_PUBLIC_SITE_URL.
 * Les pages dépendant de M14 (classement, historique, bracket) seront ajoutées
 * quand elles auront du contenu réel.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.url
  const now = new Date()

  const routes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/tournoi', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/inscription', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/types-evenements', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  ]

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}