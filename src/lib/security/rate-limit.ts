import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting serverless (M06 — couche 3 anti-abus).
 *
 * Sur Vercel, l'in-memory (Map) ne persiste PAS entre instances ni entre cold
 * starts → inefficace. On utilise Upstash Redis (HTTP/REST, compatible Edge).
 *
 * Variables d'env requises (lues par Redis.fromEnv()) :
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *
 * Algorithme : sliding window (pas de pic de requêtes au changement de fenêtre).
 *
 * Choix de la clé :
 *   - Actions non authentifiées (signUp, signIn) → par IP
 *   - Actions authentifiées (registration, paymentProof) → par user id
 *     (au Congo, l'IP est souvent partagée en 4G/wifi public).
 */

const redis = Redis.fromEnv()

/** Réutilise la connexion tant que la fonction reste "hot". */
const ephemeralCache = new Map<string, number>()

/** Limiteurs nommés par cas d'usage. */
export const limiters = {
  /** Inscription joueur : 5 tentatives / 10 min par IP. */
  signUp: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'rl:signup',
    ephemeralCache,
    analytics: true,
  }),
  /** Connexion joueur : 10 tentatives / 5 min par IP. */
  signIn: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '5 m'),
    prefix: 'rl:signin',
    ephemeralCache,
  }),
  /** Inscription tournoi (M08) : 3 / 1 min par user. */
  registration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    prefix: 'rl:registration',
    ephemeralCache,
  }),
  /** Upload preuve paiement (M10) : 5 / 10 min par user. */
  paymentProof: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'rl:payproof',
    ephemeralCache,
  }),
} as const

export type LimiterName = keyof typeof limiters

/**
 * Récupère l'IP réelle du client derrière Vercel / Cloudflare.
 * Retourne '127.0.0.1' en dernier recours (jamais undefined).
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/**
 * Applique un limiteur nommé sur une clé. Renvoie true si la requête est
 * autorisée. En cas d'erreur Redis (ex : Upstash injoignable), on FAIL-OPEN
 * (autorise) pour ne pas bloquer un joueur légitime — les autres couches
 * (Turnstile, honeypot, validation) restent actives. Le détail est loggé.
 */
export async function checkRateLimit(
  name: LimiterName,
  key: string,
): Promise<boolean> {
  try {
    const { success } = await limiters[name].limit(key)
    return success
  } catch (err) {
    console.error(`[checkRateLimit:${name}]`, err)
    return true
  }
}