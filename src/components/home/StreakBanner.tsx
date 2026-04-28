import Link from 'next/link'
import { Flame, Zap, LogIn } from 'lucide-react'
import { RANK_CONFIG } from '@/constants/theme'

interface Props {
  streak: number
  atq: number
  rank: string
  isGuest?: boolean
}

function getRankNext(atq: number, rank: string) {
  const entries = Object.entries(RANK_CONFIG)
  const next = entries.find(([, cfg]) => cfg.min > atq)
  const current = RANK_CONFIG[rank] ?? RANK_CONFIG['Scout']
  return next ? { name: next[0], atRequired: next[1].min, progress: Math.round(((atq - current.min) / (next[1].min - current.min)) * 100) } : null
}

export default function StreakBanner({ streak, atq, rank, isGuest }: Props) {
  const nextRank = !isGuest ? getRankNext(atq, rank) : null

  if (isGuest) {
    return (
      <div className="rounded-xl bg-brand-navy text-white px-5 py-5 flex items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-base">Start training your adversarial mindset.</p>
          <p className="text-xs text-white/60 mt-1">Sign in to track your ATQ score, streak, and puzzle history.</p>
        </div>
        <Link
          href="/login"
          className="flex-shrink-0 flex items-center gap-2 bg-brand-teal hover:bg-brand-tealdk text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-brand-navy text-white px-5 py-4">
      <div className="flex items-center gap-6">
        {/* Streak */}
        <div className="flex items-center gap-2">
          <Flame className="w-7 h-7 text-gate-amber" />
          <div>
            <p className="text-2xl font-semibold leading-none">{streak}</p>
            <p className="text-xs text-white/60 mt-0.5">day streak</p>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10" />

        {/* ATQ */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-teal" />
          <div>
            <p className="text-2xl font-semibold leading-none text-brand-teal">{atq}</p>
            <p className="text-xs text-white/60 mt-0.5">ATQ score</p>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10" />

        {/* Rank */}
        <div>
          <p className="text-base font-semibold leading-none">{rank}</p>
          <p className="text-xs text-white/60 mt-0.5">current rank</p>
        </div>

        {/* Progress bar */}
        {nextRank && (
          <div className="flex-1 hidden sm:block">
            <div className="flex justify-between text-[10px] text-white/50 mb-1">
              <span>{rank}</span>
              <span>Next: {nextRank.name} at {nextRank.atRequired} ATQ</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-brand-teal transition-all"
                style={{ width: `${Math.min(100, nextRank.progress)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
