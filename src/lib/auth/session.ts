/**
 * Gestion de la session admin — JWT signé HS256 + cookie httpOnly.
 *
 * PAS Supabase Auth. Système custom car les admins n'ont pas d'email
 * et que la logique de rate-limit/blocage est spécifique au PIN.
 *
 * Durée de session : 8 heures.
 * Cookie : `theplayers_admin_session`, httpOnly, sameSite=lax.
 */
import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

import { getServerEnv } from '@/lib/utils/env'

import type { Database } from '@/types/database.types'

type AdminRole = Database['public']['Enums']['admin_role']

export interface AdminSessionPayload {
  adminId: string
  username: string
  role: AdminRole
}

// Constantes exposées (réutilisées par le middleware Edge)
export const ADMIN_SESSION_COOKIE_NAME = 'theplayers_admin_session'
const SESSION_DURATION_SECONDS = 8 * 60 * 60 // 8 heures
const JWT_ALGORITHM = 'HS256'

function getSecretKey(): Uint8Array {
  const { ADMIN_SESSION_SECRET } = getServerEnv()
  return new TextEncoder().encode(ADMIN_SESSION_SECRET)
}

/**
 * Crée et pose le cookie de session admin.
 * Appelé depuis la Server Action de login après vérification du PIN.
 */
export async function createAdminSession(
  payload: AdminSessionPayload,
): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  })
}

/**
 * Lit le cookie, vérifie la signature et renvoie le payload.
 * Renvoie null si pas de cookie, signature invalide ou expiré.
 *
 * À utiliser dans Server Components / Server Actions / Route Handlers.
 * PAS dans le middleware (utiliser `verifyAdminSessionToken` à la place).
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  if (!token) return null

  return verifyAdminSessionToken(token)
}

/**
 * Variante pure : prend un token déjà extrait et le vérifie.
 * Utilisée par le middleware (Edge Runtime) qui lit les cookies
 * depuis `NextRequest.cookies` et non via `next/headers`.
 */
export async function verifyAdminSessionToken(
  token: string,
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: [JWT_ALGORITHM],
    })

    if (
      typeof payload.adminId !== 'string' ||
      typeof payload.username !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return null
    }

    return {
      adminId: payload.adminId,
      username: payload.username,
      role: payload.role as AdminRole,
    }
  } catch {
    // Signature invalide, expirée, malformée — toujours renvoyer null
    return null
  }
}

/**
 * Supprime le cookie de session.
 * Appelé depuis `/admin/logout` (Route Handler).
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME)
}