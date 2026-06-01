import 'server-only'

/**
 * Vérification serveur Cloudflare Turnstile (M06 — couche 1 anti-bot).
 *
 * Le token produit par le widget client est validé ici, côté serveur, AVANT
 * toute création de compte. On ne se fie JAMAIS au client seul.
 *
 * Variables d'env requises :
 *   - TURNSTILE_SECRET_KEY        (serveur, secret)
 *   - NEXT_PUBLIC_TURNSTILE_SITE_KEY (client, exposé dans le widget)
 *
 * Le token est à usage unique et expire (~300 s) → en cas d'échec de
 * soumission, le widget doit être régénéré côté client.
 */

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileResult {
  success: boolean
  errorCodes?: string[]
}

/**
 * Valide un token Turnstile auprès de Cloudflare.
 * Ne lève jamais : retourne { success: false } en cas d'erreur réseau/config.
 *
 * @param token    Token renvoyé par le widget client.
 * @param remoteIp IP du client (optionnelle, recommandée).
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<TurnstileResult> {
  if (!token) {
    return { success: false, errorCodes: ['missing-token'] }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error('[verifyTurnstile] TURNSTILE_SECRET_KEY manquante')
    return { success: false, errorCodes: ['missing-secret'] }
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    })

    if (!res.ok) {
      return { success: false, errorCodes: ['verify-http-error'] }
    }

    const data = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
    }

    return { success: data.success, errorCodes: data['error-codes'] }
  } catch (err) {
    console.error('[verifyTurnstile]', err)
    return { success: false, errorCodes: ['verify-exception'] }
  }
}