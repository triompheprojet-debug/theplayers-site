/**
 * cn() — utilitaire standard pour composer des classes Tailwind sans conflit.
 *
 * Combine clsx (concat conditionnelle) + tailwind-merge (résolution
 * intelligente des conflits utility-first, ex: "p-2 p-4" → "p-4").
 *
 * Convention shadcn/ui — à utiliser dans tous les composants.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}