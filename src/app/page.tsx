import { PUZZLES, DAILY_PUZZLE_ID } from '@/data/puzzles'
import DailyCard from '@/components/home/DailyCard'
import StreakBanner from '@/components/home/StreakBanner'
import { createClient } from '@/lib/supabase/server'
import { RANK_CONFIG } from '@/constants/theme'
import { BookOpen, Target } from 'lucide-react'

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

  let streak = 0
  let atq = 0
  let rank = 'Scout'
  let solvedIds = new Set<string>()

  if (user) {
    const [{ data: profile }, { data: completions }] = await Promise.all([
      supabase.from('profiles').select('atq_score, streak').eq('id', user.id).single(),
      supabase.from('puzzle_completions').select('puzzle_id').eq('user_id', user.id),
    ])
    streak = profile?.streak ?? 0
    atq    = profile?.atq_score ?? 0
    rank   = getRank(atq)
    solvedIds = new Set((completions ?? []).map((c) => c.puzzle_id))
  }

  const dailyPuzzle   = PUZZLES.find((p) => p.id === DAILY_PUZZLE_ID)
  const archivePuzzles = PUZZLES.filter((p) => p.id !== DAILY_PUZZLE_ID)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <StreakBanner streak={streak} atq={atq} rank={rank} isGuest={!user} />

      {/* Daily puzzle */}
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

      {/* Season callout */}
      <div className="rounded-xl border border-gate-amber/40 bg-gate-amberlite px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-sm font-semibold text-gate-amberdk">Season 2: The AI Red-Teamer</p>
            <p className="text-xs text-gate-amber mt-0.5 leading-relaxed">
              This week: AI agent permission sets and agentic logic exploits. You&apos;re trying to trick autonomous systems into bypassing their own constraints.
            </p>
          </div>
        </div>
      </div>

      {/* Practice puzzles */}
      {archivePuzzles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-slate-mid" />
            <h2 className="text-sm font-semibold text-slate uppercase tracking-wide">
              Practice Archive
            </h2>
          </div>
          <div className="space-y-3">
            {archivePuzzles.map((p) => (
              <DailyCard key={p.id} puzzle={p} compact solved={solvedIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
