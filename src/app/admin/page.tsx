import { redirect } from 'next/navigation'

/**
 * Point d'entrée /admin → redirige vers le tableau de bord.
 * La protection d'auth est assurée par le middleware + le layout
 * (protected). Hors Route Group (protected) volontairement.
 */
export default function AdminIndexPage() {
  redirect('/admin/dashboard')
}
