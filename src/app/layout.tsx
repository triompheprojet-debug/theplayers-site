import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

import { QueryProvider } from '@/components/providers/QueryProvider'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'THE PLAYERS — Liga Esport FC',
    template: '%s — THE PLAYERS',
  },
  description:
    'Tournois de football virtuel à Pointe-Noire, République du Congo.',
  applicationName: 'THE PLAYERS',
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: { type: 'website', locale: 'fr_CG', siteName: 'THE PLAYERS' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0a0a14',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <QueryProvider>
          <SupabaseProvider>
            {children}
            <ToastProvider />
          </SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  )
}