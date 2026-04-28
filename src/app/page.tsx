import { PUZZLES, DAILY_PUZZLE_ID } from '@/data/puzzles'
import DailyCard from '@/components/home/DailyCard'
import StreakBanner from '@/components/home/StreakBanner'
import { BookOpen, Target } from 'lucide-react'

export default function HomePage() {
  const dailyPuzzle = PUZZLES.find((p) => p.id === DAILY_PUZZLE_ID)
  const archivePuzzles = PUZZLES.filter((p) => p.id !== DAILY_PUZZLE_ID)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Streak banner */}
      <StreakBanner streak={7} atq={342} rank="Analyst" />

      {/* Daily puzzle */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-brand-navy" />
          <h2 className="text-sm font-semibold text-brand-navy uppercase tracking-wide">
            Today&apos;s Puzzle
          </h2>
        </div>
        {dailyPuzzle ? (
          <DailyCard puzzle={dailyPuzzle} isToday />
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
              <DailyCard key={p.id} puzzle={p} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
