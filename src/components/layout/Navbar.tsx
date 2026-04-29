'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Flame, Puzzle, User, Shield, LogIn, LogOut, BookOpen, ShieldAlert,
  Layers, Trophy, ChevronDown, Settings, Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface ProfileData {
  username: string | null
  atq_score: number
  streak: number
}

const NAV_ITEMS = [
  { href: '/home',        label: 'Today',       icon: Flame   },
  { href: '/puzzles',     label: 'Puzzles',      icon: Puzzle  },
  { href: '/leaderboard', label: 'Leaderboard',  icon: Trophy  },
  { href: '/docs',        label: 'Docs',         icon: BookOpen },
  { href: '/sandbox',     label: 'Sandbox',      icon: Layers  },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchProfile(data.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setIsAdmin(false) }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileOpen])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username, atq_score, streak, is_admin')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile({ username: data.username, atq_score: data.atq_score, streak: data.streak })
      setIsAdmin(data.is_admin ?? false)
    }
  }

  function handleSignIn() {
    router.push(`/login?next=${encodeURIComponent(pathname)}`)
  }

  async function handleSignOut() {
    setProfileOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'You'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="bg-brand-navy text-white shadow-md sticky top-0 z-50"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
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
          {isAdmin && (
            <Link
              href="/admin"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-brand-teal/20 text-brand-teal'
                  : 'text-brand-teal/70 hover:text-brand-teal hover:bg-brand-teal/10',
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              {/* Streak + ATQ inline */}
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-gate-amber" />
                  <span className="font-semibold">{profile?.streak ?? '—'}</span>
                  <span className="text-white/40 text-xs">streak</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-brand-teal" />
                  <span className="font-semibold text-brand-teal">{profile?.atq_score.toLocaleString() ?? '—'}</span>
                  <span className="text-white/40 text-xs">ATQ</span>
                </div>
              </div>

              {/* Profile dropdown trigger */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-1.5 group"
                  aria-label="Account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-xs font-semibold text-brand-teal group-hover:bg-brand-teal/30 transition-colors">
                    {initial}
                  </div>
                  <ChevronDown className={clsx('w-3.5 h-3.5 text-white/50 transition-transform', profileOpen && 'rotate-180')} />
                </button>

                {/* Dropdown panel */}
                {profileOpen && (
                  <div className="absolute right-0 top-10 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-teal/20 border-2 border-brand-teal/40 flex items-center justify-center text-sm font-bold text-brand-teal flex-shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-brand-navy truncate">{displayName}</p>
                          {user.email && (
                            <p className="text-[10px] text-slate-mid truncate">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-gate-amber" />
                          <span className="text-xs font-semibold text-brand-navy">{profile?.streak ?? 0}</span>
                          <span className="text-[10px] text-slate-mid">streak</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-brand-teal" />
                          <span className="text-xs font-semibold text-brand-teal">{(profile?.atq_score ?? 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-mid">ATQ</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate hover:text-brand-navy hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-mid" />
                        My Profile
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate hover:text-brand-navy hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-mid" />
                        Account Settings
                      </Link>
                      <Link
                        href="/leaderboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate hover:text-brand-navy hover:bg-slate-50 transition-colors"
                      >
                        <Trophy className="w-4 h-4 text-slate-mid" />
                        Leaderboard
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-target-red hover:bg-target-redlite transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
