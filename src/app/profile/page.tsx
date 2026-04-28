import { RANK_CONFIG, DOMAIN_ICONS, TIER_CONFIG } from '@/constants/theme'
import { Shield, Flame, Zap, Lock } from 'lucide-react'

export const metadata = {
  title: 'Profile — BreachLogic',
}

// Mock user data — replace with real auth/DB in production
const MOCK_USER = {
  displayName: 'Bolaji V.',
  rank: 'Analyst' as const,
  atq: 342,
  atqPublic: false,
  streak: 7,
  streakFreezes: 1,
  totalSolved: 14,
  solvedByDomain: {
    'AI Agents': 3,
    'Financial Controls': 5,
    'Cloud IAM': 4,
    'Compliance GRC': 2,
  },
}

export default function ProfilePage() {
  const rankCfg = RANK_CONFIG[MOCK_USER.rank]
  const nextRank = Object.entries(RANK_CONFIG).find(
    ([, cfg]) => cfg.min > MOCK_USER.atq,
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="rounded-xl bg-brand-navy text-white p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-teal/20 border-2 border-brand-teal flex items-center justify-center text-xl font-semibold text-brand-teal">
            {MOCK_USER.displayName.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-semibold">{MOCK_USER.displayName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: rankCfg.bgColor, color: rankCfg.color }}
              >
                {MOCK_USER.rank}
              </span>
              <span className="text-xs text-white/60 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                ATQ private
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-semibold text-brand-teal">{MOCK_USER.atq}</p>
            <p className="text-xs text-white/60">ATQ score</p>
          </div>
        </div>

        {/* ATQ progress bar */}
        {nextRank && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-white/50 mb-1">
              <span>{MOCK_USER.rank}</span>
              <span>{nextRank[0]} at {nextRank[1].min} ATQ</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-brand-teal"
                style={{
                  width: `${Math.round(
                    ((MOCK_USER.atq - rankCfg.min) / (nextRank[1].min - rankCfg.min)) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Puzzles solved', value: MOCK_USER.totalSolved, icon: Shield },
          { label: 'Day streak',     value: MOCK_USER.streak,      icon: Flame  },
          { label: 'Streak freezes', value: MOCK_USER.streakFreezes, icon: Zap  },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-200 p-4 text-center">
            <Icon className="w-4 h-4 text-brand-navy mx-auto mb-1" />
            <p className="text-2xl font-semibold text-brand-navy">{value}</p>
            <p className="text-[11px] text-slate-mid mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Domain breakdown */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-brand-navy mb-4">Puzzles solved by domain</h2>
        <div className="space-y-3">
          {Object.entries(MOCK_USER.solvedByDomain).map(([domain, count]) => (
            <div key={domain} className="flex items-center gap-3">
              <span className="text-base w-6 text-center">{DOMAIN_ICONS[domain] ?? '🔒'}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate">{domain}</span>
                  <span className="text-slate-mid">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-lite">
                  <div
                    className="h-1.5 rounded-full bg-brand-teal"
                    style={{ width: `${Math.round((count / MOCK_USER.totalSolved) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ATQ privacy toggle */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-brand-navy mb-1">ATQ Visibility</h2>
        <p className="text-xs text-slate mb-4">
          Your Adversarial Thinking Quotient is private by default. Opt in to appear on the public
          leaderboard by domain.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate">Public leaderboard</p>
            <p className="text-[11px] text-slate-mid">Show your ATQ and rank publicly</p>
          </div>
          <button className="relative w-11 h-6 rounded-full bg-slate-lite border border-slate-200 transition-colors">
            <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-slate-mid transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
