import { Lock } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ConfidentialNoticeProps {
  message?: string
  className?: string
}

/**
 * Bandeau d'alerte pour informations sensibles côté admin (Règle 1 :
 * capacité tournoi, etc.).
 *
 * À placer en tête des pages affichant des données confidentielles
 * (capacité, marge financière, coordonnées privées, etc.).
 */
export function ConfidentialNotice({
  message = 'Information confidentielle — ne jamais communiquer publiquement.',
  className,
}: ConfidentialNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-lg px-4 py-3',
        'bg-admin/10 border border-admin/30',
        'text-sm text-admin',
        className,
      )}
    >
      <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="font-semibold">{message}</p>
    </div>
  )
}