'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-400">Authentication failed</h1>
        <p className="text-gray-400">Something went wrong during sign-in.</p>
        <Link href="/" className="text-[#00BCD4] hover:underline text-sm">
          Return home
        </Link>
      </div>
    </div>
  )
}
