import type { Metadata } from 'next'
import Script from 'next/script'

import { SignUpForm } from '@/app/(auth)/inscription/components/SignUpForm'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Inscris-toi pour rejoindre la compétition.',
}

export default function SignUpPage() {
  return (
    <>
      {/* API Cloudflare Turnstile : rend automatiquement les widgets .cf-turnstile */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        async
        defer
      />
      <SignUpForm />
    </>
  )
}