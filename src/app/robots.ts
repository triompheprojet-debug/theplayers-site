import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/config/site'

/**
 * robots.txt généré dynamiquement.
 * Sert à : autoriser l'indexation du public, bloquer les espaces privés,
 * pointer Google vers le sitemap. URL prise depuis NEXT_PUBLIC_SITE_URL (via SITE_CONFIG).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/joueur', '/arbitre', '/api', '/dev'],
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  }
}