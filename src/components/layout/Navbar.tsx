'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Archive, Layers, User, Shield } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/',         label: 'Today',   icon: Flame   },
  { href: '/archive',  label: 'Archive', icon: Archive },
  { href: '/sandbox',  label: 'Sandbox', icon: Layers  },
  { href: '/profile',  label: 'Profile', icon: User    },
]

export default function Navbar() {
  const pathname = usePathname()

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

        {/* Right side: streak + ATQ */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Flame className="w-4 h-4 text-gate-amber" />
            <span className="font-semibold">7</span>
            <span className="text-white/50 text-xs">streak</span>
          </div>
          <div className="text-sm text-white/70">
            ATQ <span className="font-semibold text-brand-teal">342</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-xs font-semibold text-brand-teal">
            B
          </div>
        </div>
      </div>
    </header>
  )
}
