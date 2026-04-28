import { notFound } from 'next/navigation'
import { getPuzzleById, PUZZLES } from '@/data/puzzles'
import PuzzleCanvas from '@/components/puzzle/PuzzleCanvas'
import { DOMAIN_ICONS, TIER_CONFIG } from '@/constants/theme'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return PUZZLES.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const puzzle = getPuzzleById(id)
  if (!puzzle) return { title: 'Puzzle not found' }
  return {
    title: `${puzzle.meta.title} — BreachLogic`,
    description: puzzle.narrative.scenario,
  }
}

export default async function PuzzlePage({ params }: Props) {
  const { id } = await params
  const puzzle = getPuzzleById(id)
  if (!puzzle) return notFound()

  const tierCfg = TIER_CONFIG[puzzle.meta.tier]

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem - 3rem)' }}>
      {/* Intel brief */}
      <div className="mb-3 rounded-lg border border-brand-teal/30 bg-brand-teallite px-4 py-3 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{DOMAIN_ICONS[puzzle.meta.domain] ?? '🔒'}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-brand-tealdk uppercase tracking-wider mb-1">
            Intel Brief — {puzzle.narrative.world}
          </p>
          <p className="text-xs text-slate leading-relaxed">{puzzle.narrative.intel_brief}</p>
        </div>
        <span
          className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: tierCfg.bgColor, color: tierCfg.color }}
        >
          {tierCfg.label} · ~{puzzle.meta.estimated_minutes}m
        </span>
      </div>

      {/* Canvas — takes remaining height */}
      <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <PuzzleCanvas puzzle={puzzle} />
      </div>
    </div>
  )
}
