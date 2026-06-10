/**
 * Validation typée des variables d'environnement.
 *
 * Toute lecture d'env doit passer par ces helpers, jamais process.env directement.
 *
 * - getServerEnv() : usage Server-only (lance une erreur si manquante)
 * - getPublicEnv() : usage client-safe (NEXT_PUBLIC_*)
 */

// ============================================================================
// Server env (uniquement côté serveur — ne pas importer depuis Client Components)
// ============================================================================
interface ServerEnv {
  SUPABASE_SERVICE_ROLE_KEY: string
  ADMIN_SESSION_SECRET: string
  JWT_SECRET: string
  CRON_SECRET: string
}

function readEnv(key: string): string {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `Variable d'environnement manquante : ${key}. ` +
        `Vérifier .env.local (dev) ou la config de l'hébergeur (prod).`,
    )
  }
  return value
}

export function getServerEnv(): ServerEnv {
  // 1. Protection immédiate contre l'importation côté client
  if (typeof window !== 'undefined') {
    throw new Error(
      'getServerEnv() ne doit être appelé que côté serveur (Server Component, Server Action, Route Handler).',
    )
  }

  // 2. Lecture via le helper commun + validation de la longueur requise (32+ chars)
  const ADMIN_SESSION_SECRET = readEnv('ADMIN_SESSION_SECRET')
  if (ADMIN_SESSION_SECRET.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET est trop court (32+ caractères requis). ' +
        'Générer avec : node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"',
    )
  }

  // 3. Retour propre et uniforme de toutes les clés serveur
  return {
    SUPABASE_SERVICE_ROLE_KEY: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
    ADMIN_SESSION_SECRET, // Utilise la constante en majuscule directement
    JWT_SECRET: readEnv('JWT_SECRET'),
    CRON_SECRET: readEnv('CRON_SECRET'),
  }
}

// ============================================================================
// Public env (exposée au client — préfixe NEXT_PUBLIC_)
// ============================================================================
interface PublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_SITE_URL: string
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string | undefined
}

export function getPublicEnv(): PublicEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_SITE_URL: readEnv('NEXT_PUBLIC_SITE_URL'),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  }
}