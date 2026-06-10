/**
 * Retry avec exponential backoff.
 *
 * Cas d'usage typiques :
 *  - Appels Supabase qui échouent ponctuellement (rate-limit, timeout réseau)
 *  - Webhooks de paiement (M09) à re-tenter
 *  - Génération de PDF (M11) qui dépend de polices externes
 *
 * ⚠️ NE PAS utiliser pour les écritures DB sensibles (paiements, inscriptions)
 * sans idempotence garantie côté DB (risque de doublons).
 */

interface RetryOptions {
  /** Nombre max de tentatives. Défaut : 3 */
  maxAttempts?: number
  /** Délai initial en ms. Défaut : 200 */
  initialDelayMs?: number
  /** Multiplicateur entre tentatives. Défaut : 2 (exponentiel) */
  backoffFactor?: number
  /** Délai max en ms. Défaut : 5000 */
  maxDelayMs?: number
  /** Filtre : si retourne false, l'erreur n'est pas retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean
  /** Hook appelé entre chaque tentative (logs) */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 200,
    backoffFactor = 2,
    maxDelayMs = 5000,
    shouldRetry = () => true,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Dernière tentative : on remonte l'erreur
      if (attempt === maxAttempts) break

      // Filtre métier (ex : ne pas retry une erreur 4xx)
      if (!shouldRetry(error, attempt)) break

      // Calcul du délai
      const delayMs = Math.min(
        initialDelayMs * Math.pow(backoffFactor, attempt - 1),
        maxDelayMs,
      )

      onRetry?.(error, attempt, delayMs)
      await sleep(delayMs)
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}