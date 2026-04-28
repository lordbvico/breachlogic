'use client'

import { useEffect, useRef } from 'react'
import type { Puzzle, TokenPlacement } from '@/types/puzzle'
import { SEAM_TYPE_LABELS, TIER_CONFIG } from '@/constants/theme'
import { CheckCircle, Share2, RotateCcw } from 'lucide-react'
import { formatElapsed, computeAtqDelta } from '@/lib/puzzle-engine'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Props {
  puzzle: Puzzle
  placements: TokenPlacement[]
  elapsedMs: number
  hintsUsed: number
  onPlayAgain: () => void
}

export default function BreachOverlay({
  puzzle,
  placements,
  elapsedMs,
  hintsUsed,
  onPlayAgain,
}: Props) {
  const { meta, solution, pedagogy } = puzzle
  const tierCfg = TIER_CONFIG[meta.tier]
  const seamLabel = SEAM_TYPE_LABELS[solution.seam_type] ?? solution.seam_type
  const atqDelta = computeAtqDelta(meta.tier, hintsUsed, elapsedMs, meta.estimated_minutes)
  const saved = useRef(false)

  useEffect(() => {
    if (saved.current) return
    saved.current = true

    async function persist() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upsert completion (unique constraint on user_id + puzzle_id)
      const { error: compError } = await supabase
        .from('puzzle_completions')
        .upsert({
          user_id: user.id,
          puzzle_id: puzzle.id,
          elapsed_ms: elapsedMs,
          hints_used: hintsUsed,
          atq_delta: atqDelta,
          tier: meta.tier,
        }, { onConflict: 'user_id,puzzle_id' })

      if (compError) {
        console.error('Failed to save completion:', compError.message)
        return
      }

      // Increment ATQ score on profile
      await supabase.rpc('increment_atq', { user_id: user.id, delta: atqDelta })
    }

    persist()
  }, [])

  const nodeMap = Object.fromEntries(
    puzzle.map.nodes.map((n) => [n.id, n.label]),
  )

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in rounded-none z-20">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <CheckCircle className="w-10 h-10 text-success-green mx-auto mb-2" />
          <h2 className="text-2xl font-semibold text-success-green">Breach Confirmed</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: tierCfg.bgColor, color: tierCfg.color }}
            >
              {seamLabel}
            </span>
            <span className="text-xs text-slate-mid">{formatElapsed(elapsedMs)}</span>
          </div>
        </div>

        {/* ATQ delta */}
        <div className="rounded-xl bg-brand-navy text-white px-4 py-3 text-center mb-4">
          <p className="text-xs text-white/60 mb-1">ATQ earned</p>
          <p className="text-3xl font-semibold text-brand-teal">+{atqDelta}</p>
          {hintsUsed > 0 && (
            <p className="text-xs text-white/50 mt-0.5">
              ({hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} used — penalty applied)
            </p>
          )}
        </div>

        {/* Teaching moment */}
        <div className="rounded-lg bg-success-greenlite border border-success-green/30 px-4 py-3 mb-4">
          <p className="text-[10px] font-semibold text-success-green uppercase tracking-wider mb-1.5">
            Teaching moment
          </p>
          <p className="text-xs text-slate leading-relaxed">{pedagogy.aha_moment}</p>
        </div>

        {/* Seam description */}
        <div className="rounded-lg bg-gate-amberlite border border-gate-amber/30 px-4 py-3 mb-4">
          <p className="text-[10px] font-semibold text-gate-amber uppercase tracking-wider mb-1.5">
            The seam
          </p>
          <p className="text-xs text-gate-amberdk leading-relaxed">{solution.seam_description}</p>
        </div>

        {/* Solution steps */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider mb-2">
            Solution path
          </p>
          <div className="space-y-2">
            {solution.steps.map((step) => (
              <div key={step.step} className="flex gap-3 text-xs">
                <div className="w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5">
                  {step.step}
                </div>
                <div>
                  <p className="font-medium text-brand-navy">{nodeMap[step.node_id]}: {step.action}</p>
                  <p className="text-slate-mid leading-relaxed mt-0.5">{step.mechanism}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework mapping */}
        {pedagogy.framework_mapping && pedagogy.framework_mapping.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {pedagogy.framework_mapping.map((ref) => (
              <span
                key={ref}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-lite text-slate font-medium"
              >
                {ref}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <button
            className="flex-1 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navydk transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              const text = `Just breached the "${puzzle.meta.title}" puzzle on BreachLogic! Seam type: ${seamLabel} | ATQ +${atqDelta} #BreachLogic #SecurityMindset`
              window.open(`https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(text)}`, '_blank')
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
