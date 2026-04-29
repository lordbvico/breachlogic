'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Puzzle, TokenPlacement } from '@/types/puzzle'
import { SEAM_TYPE_LABELS, TIER_CONFIG } from '@/constants/theme'
import { CheckCircle, Share2, RotateCcw, ArrowLeft, Zap, Wrench } from 'lucide-react'
import { formatElapsed, computeAtqDelta } from '@/lib/puzzle-engine'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Props {
  puzzle: Puzzle
  placements: TokenPlacement[]
  elapsedMs: number
  hintsUsed: number
  challengeMode?: boolean
  mcMode?: boolean
  onPlayAgain: () => void
  onStartRepair?: () => void
}

export default function BreachOverlay({
  puzzle,
  placements,
  elapsedMs,
  hintsUsed,
  challengeMode = false,
  mcMode = false,
  onPlayAgain,
  onStartRepair,
}: Props) {
  const router = useRouter()
  const { meta, solution, pedagogy } = puzzle
  const tierCfg   = TIER_CONFIG[meta.tier]
  const seamLabel = SEAM_TYPE_LABELS[solution.seam_type] ?? solution.seam_type

  const baseAtqDelta = computeAtqDelta(meta.tier, hintsUsed, elapsedMs, meta.estimated_minutes)
  const atqDelta = challengeMode
    ? Math.round(baseAtqDelta * 1.5)
    : mcMode
    ? Math.round(baseAtqDelta * 0.75)
    : baseAtqDelta

  const saved = useRef(false)

  useEffect(() => {
    if (saved.current) return
    saved.current = true

    async function persist() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if already completed — only award ATQ on first completion
      const { data: existing } = await supabase
        .from('puzzle_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('puzzle_id', puzzle.id)
        .maybeSingle()

      if (existing) {
        // Already solved before — update stats but do NOT award ATQ again
        await supabase
          .from('puzzle_completions')
          .update({
            elapsed_ms: elapsedMs,
            hints_used: hintsUsed,
            atq_delta:  atqDelta,
          })
          .eq('id', existing.id)
        return
      }

      // First completion — insert and award ATQ
      const { error: compError } = await supabase
        .from('puzzle_completions')
        .insert({
          user_id:    user.id,
          puzzle_id:  puzzle.id,
          elapsed_ms: elapsedMs,
          hints_used: hintsUsed,
          atq_delta:  atqDelta,
          tier:       meta.tier,
        })

      if (compError) {
        console.error('Failed to save completion:', compError.message)
        return
      }

      await supabase.rpc('increment_atq', { user_id: user.id, delta: atqDelta })

      // ── Streak tracking ────────────────────────────────────────────────────
      // ── Streak tracking ────────────────────────────────────────────────────
      // last_activity_date is a text column (YYYY-MM-DD) tracking consecutive days.
      // Cast through unknown to avoid TS complaining about columns not in generated types.
      const today = new Date().toISOString().slice(0, 10)
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('streak, last_activity_date')
        .eq('id', user.id)
        .single()

      type ProfileStreak = { streak?: number | null; last_activity_date?: string | null }
      const profile = profileRow as unknown as ProfileStreak | null

      const lastDate = profile?.last_activity_date ?? null
      const currentStreak = profile?.streak ?? 0

      if (lastDate !== today) {
        let newStreak: number
        if (!lastDate) {
          newStreak = 1
        } else {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().slice(0, 10)
          newStreak = lastDate === yesterdayStr ? currentStreak + 1 : 1
        }

        await supabase
          .from('profiles')
          .update({ streak: newStreak, last_activity_date: today } as never)
          .eq('id', user.id)
      }
    }

    persist()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const nodeMap = Object.fromEntries(
    puzzle.map.nodes.map((n) => [n.id, n.label]),
  )

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">

      {/* Sticky header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-5 h-5 text-success-green flex-shrink-0" />
          <h2 className="text-base font-semibold text-success-green">Seam Identified</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: tierCfg.bgColor, color: tierCfg.color }}
          >
            {seamLabel}
          </span>
          <span className="text-[11px] text-slate-mid">{formatElapsed(elapsedMs)}</span>
          {challengeMode && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gate-amberlite border border-gate-amber/30 text-gate-amberdk">
              <Zap className="w-2.5 h-2.5" />Challenge
            </span>
          )}
          {mcMode && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-teallite border border-brand-teal/20 text-brand-tealdk">
              MC
            </span>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ATQ earned */}
        <div className="rounded-xl bg-brand-navy text-white px-4 py-3 text-center">
          <p className="text-[10px] text-white/60 mb-0.5">ATQ earned</p>
          <p className="text-3xl font-semibold text-brand-teal">+{atqDelta}</p>
          {challengeMode && (
            <p className="text-[10px] text-gate-amber mt-0.5">
              ×1.5 Challenge Bonus (base: +{baseAtqDelta})
            </p>
          )}
          {mcMode && (
            <p className="text-[10px] text-white/50 mt-0.5">
              ×0.75 Multiple Choice (base: +{baseAtqDelta})
            </p>
          )}
          {hintsUsed > 0 && !challengeMode && (
            <p className="text-[10px] text-white/50 mt-0.5">
              ({hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} — penalty applied)
            </p>
          )}
        </div>

        {/* Teaching moment */}
        <div className="rounded-lg bg-success-greenlite border border-success-green/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-success-green uppercase tracking-wider mb-1">
            Teaching Moment
          </p>
          <p className="text-xs text-slate leading-relaxed">{pedagogy.aha_moment}</p>
        </div>

        {/* Seam description */}
        <div className="rounded-lg bg-gate-amberlite border border-gate-amber/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-gate-amber uppercase tracking-wider mb-1">
            The Seam
          </p>
          <p className="text-xs text-gate-amberdk leading-relaxed">{solution.seam_description}</p>
        </div>

        {/* Breach path — cross-references the canvas highlight */}
        <div>
          <p className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider mb-2">
            Breach Path
            <span className="ml-1.5 font-normal text-success-green normal-case">(highlighted ←)</span>
          </p>
          <div className="space-y-2">
            {solution.steps.map((step) => (
              <div key={step.step} className="flex gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5">
                  {step.step}
                </div>
                <div>
                  <p className="font-medium text-brand-navy leading-snug">
                    {nodeMap[step.node_id]}: {step.action}
                  </p>
                  <p className="text-slate-mid leading-relaxed mt-0.5">{step.mechanism}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework tags */}
        {pedagogy.framework_mapping && pedagogy.framework_mapping.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pedagogy.framework_mapping.map((ref) => (
              <span key={ref} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-lite text-slate font-medium">
                {ref}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3 space-y-2 flex-shrink-0">

        {/* Fix the Seam — repair mode entry */}
        {onStartRepair && (
          <button
            onClick={onStartRepair}
            className="w-full py-2 rounded-lg bg-brand-teal/10 border border-brand-teal/30 text-brand-tealdk text-xs font-semibold hover:bg-brand-teallite transition-colors flex items-center justify-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            Fix the Seam
            <span className="text-brand-teal/60 font-normal">(+bonus ATQ)</span>
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-brand-navy text-white text-xs font-medium hover:bg-brand-navydk transition-colors flex items-center justify-center gap-1.5"
            onClick={() => {
              const text = `Just identified the "${puzzle.meta.title}" seam on BreachLogic! Type: ${seamLabel} | ATQ +${atqDelta} #BreachLogic #SecurityMindset`
              window.open(`https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(text)}`, '_blank')
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>

        <button
          onClick={() => router.push('/puzzles')}
          className="w-full py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-mid hover:text-brand-navy hover:border-brand-navy/30 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Puzzles
        </button>
      </div>
    </div>
  )
}
