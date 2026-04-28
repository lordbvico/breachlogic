import { Flame, Zap } from 'lucide-react'

interface Props {
  streak: number
  atq: number
  rank: string
}

export default function StreakBanner({ streak, atq, rank }: Props) {
  return (
    <div className="rounded-xl bg-brand-navy text-white px-5 py-4 flex items-center gap-6">
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

      {/* Progress to next rank (mock) */}
      <div className="flex-1 hidden sm:block">
        <div className="flex justify-between text-[10px] text-white/50 mb-1">
          <span>{rank}</span>
          <span>Next rank: 400 ATQ</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-brand-teal transition-all"
            style={{ width: `${Math.round((atq / 400) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
