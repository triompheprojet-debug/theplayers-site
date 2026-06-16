import { redirect } from 'next/navigation'

import { ROUTES } from '@/config/routes'

/**
 * Point d'entrée /arbitre → redirige vers la saisie de score (écran principal
 * du jour J). La protection d'auth/rôle est assurée par le middleware et le
 * layout arbitre.
 */
export default function RefereeIndexPage() {
  redirect(ROUTES.referee.scoreEntry)
}