/**
 * Types des contrats API et Server Actions du projet.
 *
 * Note : ActionResult était initialement dans app.types.ts.
 * On le déplace ici pour respecter le guide de codage §5.3.
 * Le re-export depuis app.types.ts est conservé pour rétro-compatibilité.
 */

/**
 * Résultat standardisé d'une Server Action.
 *
 * - success: true  → data contient le résultat
 * - success: false → error message + fieldErrors optionnel (validation Zod par champ)
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Helper pour construire un succès typé.
 */
export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Helper pour construire un échec.
 */
export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error, fieldErrors }
}

/**
 * Métadonnées de pagination pour les listes (admin tableaux).
 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/**
 * Réponse paginée standard.
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}