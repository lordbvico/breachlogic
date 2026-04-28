'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Flame, Archive, Layers, User, Shield, LogIn, LogOut, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/',         label: 'Today',   icon: Flame    },
  { href: '/archive',  label: 'Archive', icon: Archive  },
  { href: '/docs',     label: 'Docs',    icon: BookOpen },
  { href: '/sandbox',  label: 'Sandbox', icon: Layers   },
  { href: '/profile',  label: 'Profile', icon: User     },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  const initials = user?.email?.slice(0, 1).toUpperCase() ?? 'B'

  return (
    <header className="bg-brand-navy text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Shield className="w-5 h-5 text-brand-teal" />
          <span className="font-semibold text-base tracking-wide">
            BREACH<span className="text-brand-teal">LOGIC</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 ml-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-1.5 text-sm">
                <Flame className="w-4 h-4 text-gate-amber" />
                <span className="font-semibold">—</span>
                <span className="text-white/50 text-xs">streak</span>
              </div>
              <div className="text-sm text-white/70">
                ATQ <span className="font-semibold text-brand-teal">—</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-xs font-semibold text-brand-teal">
                {initials}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-brand-teal/10 border border-brand-teal/30 text-brand-teal hover:bg-brand-teal/20 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
