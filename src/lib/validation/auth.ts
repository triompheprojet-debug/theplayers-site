/**
 * Schémas Zod pour l'authentification admin (M02).
 *
 * Réutilise les schémas de base définis dans `common.ts`.
 */
import { z } from 'zod'

import { adminUsernameSchema, pinSchema } from './common'

export const adminLoginSchema = z.object({
  username: adminUsernameSchema,
  pin: pinSchema,
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>