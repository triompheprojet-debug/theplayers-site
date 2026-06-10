/**
 * Barrel — re-exporte les utilitaires consommés par shadcn/ui.
 *
 * shadcn génère des composants avec : import { cn } from "@/lib/utils"
 * Ce barrel résout cet import vers src/lib/utils/cn.ts.
 *
 * Ne pas y ajouter de code métier — uniquement des re-exports.
 */
export { cn } from './cn'