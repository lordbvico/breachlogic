import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PUZZLES, getDailyPuzzleForUser } from '@/data/puzzles'
import DailyCard from '@/components/home/DailyCard'
import StreakBanner from '@/components/home/StreakBanner'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { RANK_CONFIG } from '@/constants/theme'
import { Target, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Today — BreachLogic',
}

function getRank(atq: number): string {
  const entries = Object.entries(RANK_CONFIG)
  let current = entries[0][0]
  for (const [name, cfg] of entries) {
    if (atq >= cfg.min) current = name
  }
  return current
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminDb = createAdminClient()

  const [{ data: profile }, { data: completions }, { data: hiddenRows }] = await Promise.all([
    supabase.from('profiles').select('atq_score, streak').eq('id', user.id).single(),
    supabase.from('puzzle_completions').select('puzzle_id').eq('user_id', user.id),
    // Must use admin client — RLS prevents regular users from reading unpublished rows
    adminDb.from('community_puzzles').select('data').eq('published', false),
  ])

  const streak   = profile?.streak    ?? 0
  const atq      = profile?.atq_score ?? 0
  const rank     = getRank(atq)
  const solvedIds = new Set((completions ?? []).map((c) => c.puzzle_id))

  const hiddenIds = new Set(
    (hiddenRows ?? [])
      .filter((r) => (r.data as Record<string, unknown>)?._hidden === true)
      .map((r) => (r.data as Record<string, unknown>)?.id as string)
      .filter(Boolean),
  )
  const visiblePuzzles = PUZZLES.filter((p) => !hiddenIds.has(p.id))

  const dailyPuzzle = getDailyPuzzleForUser(user.id, atq, visiblePuzzles, solvedIds)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <StreakBanner streak={streak} atq={atq} rank={rank} />

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-brand-navy" />
          <h2 className="text-sm font-semibold text-brand-navy uppercase tracking-wide">
            Today&apos;s Puzzle
          </h2>
        </div>
        {dailyPuzzle ? (
          <DailyCard puzzle={dailyPuzzle} isToday solved={solvedIds.has(dailyPuzzle.id)} />
        ) : (
          <p className="text-slate-mid text-sm">No daily puzzle available.</p>
        )}
      </section>

      <RankProgress atq={atq} rank={rank} />

      <div className="rounded-xl border border-slate-200 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-brand-navy">Browse the full puzzle library</p>
        <p className="text-xs text-slate mt-1 mb-3">
          Filter by tier and domain, track your progress, and tackle community puzzles.
        </p>
        <Link
          href="/puzzles"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-brand-navydk transition-colors"
        >
          View All Puzzles
        </Link>
      </div>
    </div>
  )
}

// ── Rank Progress card ────────────────────────────────────────────────────────

const RANK_ORDER = ['Scout', 'Analyst', 'Auditor', 'Red-Teamer', 'Grandmaster'] as const
type RankName = typeof RANK_ORDER[number]

function RankProgress({ atq, rank }: { atq: number; rank: string }) {
  const cfg = RANK_CONFIG[rank]
  if (!cfg) return null

  const rankIndex  = RANK_ORDER.indexOf(rank as RankName)
  const nextRank   = rankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[rankIndex + 1] : null
  const nextCfg    = nextRank ? RANK_CONFIG[nextRank] : null
  const isMax      = !nextRank

  const rangeMin   = cfg.min
  const rangeMax   = cfg.max
  const pct        = Math.min(100, Math.round(((atq - rangeMin) / (rangeMax - rangeMin)) * 100))
  const atqToNext  = isMax ? 0 : rangeMax + 1 - atq

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-navy" />
          <h2 className="text-sm font-semibold text-brand-navy">Rank Progress</h2>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: cfg.bgColor, color: cfg.color }}
        >
          {rank}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-mid">{atq.toLocaleString()} ATQ</span>
          {isMax ? (
            <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>Max rank reached</span>
          ) : (
            <span className="text-[11px] text-slate-mid">
              <span className="font-semibold text-brand-navy">{atqToNext}</span> to {nextRank}
            </span>
          )}
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${isMax ? 100 : pct}%`, background: cfg.color }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-mid">{rangeMin}</span>
          <span className="text-[10px] text-slate-mid">{isMax ? '∞' : rangeMax + 1}</span>
        </div>
      </div>

      {/* Next rank hint */}
      {nextRank && nextCfg && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
          style={{ background: nextCfg.bgColor }}
        >
          <span className="font-semibold" style={{ color: nextCfg.color }}>{nextRank}</span>
          <span style={{ color: nextCfg.color, opacity: 0.8 }}>
            unlocks at {(rangeMax + 1).toLocaleString()} ATQ — solve more puzzles to rank up.
          </span>
        </div>
      )}
    </div>
  )
}
