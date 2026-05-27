/**
 * Script CLI — Création du premier compte SUPER_ADMIN.
 *
 * Usage :
 * pnpm create-admin <username> <pin> [display_name]
 *
 * Exemple :
 * pnpm create-admin triomphe 423789 "MOUANDA Triomphe"
 *
 * Arguments :
 * - <username>     : 3-20 caractères, minuscules + chiffres + underscores
 * - <pin>          : exactement 6 chiffres
 * - [display_name] : nom affiché (défaut : username)
 *
 * À exécuter UNE FOIS pour bootstraper l'admin initial. Les comptes admins
 * suivants seront créés depuis l'UI admin par le SUPER_ADMIN (en M20).
 *
 * Pré-requis :
 * - Variables NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local
 * - Migration 05_create_admin_accounts.sql appliquée
 */
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import WebSocket from 'ws'

// Polyfill pour injecter les WebSockets manquants dans Node.js 20
// Double transtypage avec 'unknown' pour éviter d'utiliser 'any'
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket
}

import { adminUsernameSchema, pinSchema } from '../src/lib/validation/common'

import type { Database } from '../src/types/database.types'

const BCRYPT_SALT_ROUNDS = 12

function usage(): never {
  console.error(`
Usage : pnpm create-admin <username> <pin> [display_name]

Arguments :
  <username>     3-20 caractères, minuscules + chiffres + underscores
  <pin>          exactement 6 chiffres
  [display_name] nom complet affiché (défaut : username)

Exemple :
  pnpm create-admin triomphe 423789 "MOUANDA Triomphe"
`)
  process.exit(1)
}

function fail(message: string): never {
  console.error(`\nErreur : ${message}\n`)
  process.exit(1)
}

async function main(): Promise<void> {
  const [, , rawUsername, rawPin, ...rest] = process.argv

  if (!rawUsername || !rawPin) {
    usage()
  }

  // 1. Validation Zod (réutilise les schémas du projet)
  const usernameParsed = adminUsernameSchema.safeParse(rawUsername)
  if (!usernameParsed.success) {
    fail(`username invalide — ${usernameParsed.error.issues[0]?.message ?? 'format incorrect'}`)
  }

  const pinParsed = pinSchema.safeParse(rawPin)
  if (!pinParsed.success) {
    fail(`PIN invalide — ${pinParsed.error.issues[0]?.message ?? 'format incorrect'}`)
  }

  const username = usernameParsed.data
  const pin = pinParsed.data
  const displayName = rest.join(' ').trim() || username

  // 2. Variables d'environnement
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    fail(
      'NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant. ' +
        'Le script package.json doit utiliser --env-file=.env.local.',
    )
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 3. Vérification d'unicité du username
  const { data: existing, error: selErr } = await supabase
    .from('admin_accounts')
    .select('id, role, is_active')
    .eq('username', username)
    .maybeSingle()

  if (selErr) {
    fail(`requête DB échouée — ${selErr.message}`)
  }
  if (existing) {
    fail(
      `un compte avec le username "${username}" existe déjà ` +
        `(role: ${existing.role}, actif: ${existing.is_active}).`,
    )
  }

  // 4. Hash bcrypt du PIN
  const pinHash = await bcrypt.hash(pin, BCRYPT_SALT_ROUNDS)

  // 5. Insertion
  const { data: created, error: insErr } = await supabase
    .from('admin_accounts')
    .insert({
      username,
      display_name: displayName,
      role: 'super_admin',
      pin_hash: pinHash,
      is_active: true,
    })
    .select('id, username, display_name, role, created_at')
    .single()

  if (insErr || !created) {
    fail(`insertion échouée — ${insErr?.message ?? 'cause inconnue'}`)
  }

  console.log(`
Compte SUPER_ADMIN créé avec succès.

  ID         : ${created.id}
  Username   : ${created.username}
  Display    : ${created.display_name}
  Role       : ${created.role}
  Created    : ${created.created_at}

Mémorise bien ton PIN (${pin}) — il n'est plus jamais affiché.
Connexion : ${process.env.NEXT_PUBLIC_SITE_URL ?? '<URL_SITE>'}/admin/login
`)
}

main().catch((err) => {
  console.error('\nErreur inattendue :', err)
  process.exit(1)
})