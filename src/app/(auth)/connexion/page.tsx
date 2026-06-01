import { Suspense } from 'react'
import type { Metadata } from 'next'

import { SignInForm } from '@/app/(auth)/connexion/components/SignInForm'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connecte-toi à ton espace joueur.',
}

export default function SignInPage() {
  return (
    // useSearchParams (lecture de ?next=) impose une frontière Suspense.
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  )
}