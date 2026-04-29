import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BreachLogic — Adversarial Thinking Trainer',
  description:
    'The daily puzzle that trains the security mindset. Find the logical seam in a rule-governed system before attackers do.',
  keywords: ['security training', 'adversarial thinking', 'CTEM', 'puzzle', 'cybersecurity'],
  openGraph: {
    title: 'BreachLogic',
    description: 'Train adversarial thinking — one logic puzzle a day.',
    type: 'website',
  },
}

// viewport-fit=cover is required for safe-area-inset-* to work on iOS notch / Dynamic Island
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1A237E',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/*
        pb-safe adds env(safe-area-inset-bottom) padding so content never hides
        behind the iOS home indicator bar.
      */}
      <body className={`${inter.className} bg-slate-50 text-slate-800 min-h-screen pb-[env(safe-area-inset-bottom)]`}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
