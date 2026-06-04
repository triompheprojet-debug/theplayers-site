import 'server-only'

import { getAppConfig } from '@/lib/config/app-config'

import type { MessageTemplates } from '@/types/config.types'

/**
 * Templates de messagerie depuis `app_config.message_templates` (Regle 11 :
 * zero hardcode du contenu). Renvoie `{}` si la cle est absente.
 *
 * `getAppConfig` est cache (`unstable_cache`) -> lecture service_role, pas de
 * cookies (cf. MISE_A_JOUR §3.1). OK depuis un Server Component / Server Action.
 */
export async function getMessageTemplates(): Promise<MessageTemplates> {
  const templates = await getAppConfig('message_templates')
  return templates ?? {}
}

export interface RenderedTemplate {
  subject: string
  body: string
}

/**
 * Interpolation simple `{{cle}}` -> valeur. Les variables inconnues sont
 * remplacees par une chaine vide (jamais d'expression brute laissee au joueur).
 */
export function applyTemplate(
  template: { subject: string; body: string },
  vars: Record<string, string | number> = {},
): RenderedTemplate {
  return {
    subject: interpolate(template.subject, vars),
    body: interpolate(template.body, vars),
  }
}

function interpolate(
  input: string,
  vars: Record<string, string | number>,
): string {
  return input.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const value = vars[key]
    return value === undefined || value === null ? '' : String(value)
  })
}