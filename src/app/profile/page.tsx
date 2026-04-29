import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RANK_CONFIG, DOMAIN_ICONS } from '@/constants/theme'
import { Shield, Flame, Zap, Lock } from 'lucide-react'
import { getPuzzleById } from '@/data/puzzles'
import AccountSettingsForm from '@/components/profile/AccountSettingsForm'

export const metadata = {
  title: 'Profile — BreachLogic',
}

function getRank(atq: number) {
  const entries = Object.entries(RANK_CONFIG)
  let current = entries[0]
  for (const entry of entries) {
    if (atq >= entry[1].min) current = entry
  }
  return current
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ data: profile }, { data: completions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('puzzle_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
  ])

  const atq = profile?.atq_score ?? 0
  const streak = profile?.streak ?? 0
  const totalSolved = completions?.length ?? 0
  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Hacker'

  // Domain breakdown from completions
  const solvedByDomain: Record<string, number> = {}
  for (const c of completions ?? []) {
    const puzzle = getPuzzleById(c.puzzle_id)
    if (!puzzle) continue
    const domain = puzzle.meta.domain
    solvedByDomain[domain] = (solvedByDomain[domain] ?? 0) + 1
  }

  const [rankName, rankCfg] = getRank(atq)
  const entries = Object.entries(RANK_CONFIG)
  const nextRankEntry = entries.find(([, cfg]) => cfg.min > atq)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="rounded-xl bg-brand-navy text-white p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-teal/20 border-2 border-brand-teal flex items-center justify-center text-xl font-semibold text-brand-teal">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{displayName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: rankCfg.bgColor, color: rankCfg.color }}
              >
                {rankName}
              </span>
              <span className="text-xs text-white/60 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                ATQ private
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-semibold text-brand-teal">{atq}</p>
            <p className="text-xs text-white/60">ATQ score</p>
          </div>
        </div>

        {/* ATQ progress bar */}
        {nextRankEntry && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-white/50 mb-1">
              <span>{rankName}</span>
              <span>{nextRankEntry[0]} at {nextRankEntry[1].min} ATQ</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-brand-teal"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(((atq - rankCfg.min) / (nextRankEntry[1].min - rankCfg.min)) * 100),
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
          { label: 'Puzzles solved', value: totalSolved, icon: Shield },
          { label: 'Day streak',     value: streak,      icon: Flame  },
          { label: 'Streak freezes', value: 0,           icon: Zap    },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-200 p-4 text-center">
            <Icon className="w-4 h-4 text-brand-navy mx-auto mb-1" />
            <p className="text-2xl font-semibold text-brand-navy">{value}</p>
            <p className="text-[11px] text-slate-mid mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Domain breakdown */}
      {Object.keys(solvedByDomain).length > 0 && (
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-brand-navy mb-4">Puzzles solved by domain</h2>
          <div className="space-y-3">
            {Object.entries(solvedByDomain).map(([domain, count]) => (
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
                      style={{ width: `${Math.round((count / totalSolved) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account settings */}
      <AccountSettingsForm
        userId={user.id}
        email={user.email ?? ''}
        initialUsername={profile?.username ?? null}
      />
    </div>
  )
}
