import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-800 min-h-screen`}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
