'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Puzzle } from '@/types/puzzle'
import type { RepairChoice } from '@/lib/puzzle-engine'
import { createClient } from '@/lib/supabase/client'
import { Wrench, Check, X, ArrowLeft, RotateCcw, Zap } from 'lucide-react'
import clsx from 'clsx'

const CHOICE_LETTERS = ['A', 'B', 'C', 'D']

type RepairPhase = 'selecting' | 'correct' | 'wrong'

interface Props {
  puzzle: Puzzle
  choices: RepairChoice[]
  baseSolveAtq: number        // ATQ earned during the solve — bonus is 50% of this
  onBack: () => void          // go back to BreachOverlay
  onRepairConfirmed?: () => void  // called when correct fix is confirmed — triggers patched graph
}

export default function RepairModePanel({ puzzle, choices, baseSolveAtq, onBack, onRepairConfirmed }: Props) {
  const router = useRouter()
  const [repairPhase, setRepairPhase] = useState<RepairPhase>('selecting')
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const bonusAtq = Math.max(1, Math.round(baseSolveAtq * 0.5))
  const savedBonus = useRef(false)

  // Save bonus ATQ when correct answer confirmed
  useEffect(() => {
    if (repairPhase !== 'correct' || savedBonus.current) return
    savedBonus.current = true
    async function persist() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.rpc('increment_atq', { user_id: user.id, delta: bonusAtq })
    }
    persist()
  }, [repairPhase, bonusAtq])

  function handleConfirm() {
    if (!selected) return
    const choice = choices.find((c) => c.id === selected)
    if (!choice) return
    if (choice.isCorrect) {
      setRepairPhase('correct')
      onRepairConfirmed?.()
    } else {
      setRepairPhase('wrong')
    }
  }

  function handleRetry() {
    setRepairPhase('selecting')
    setSelected(null)
  }

  const selectedChoice = choices.find((c) => c.id === selected)

  // ── Result screens ────────────────────────────────────────────────────────

  if (repairPhase === 'correct') {
    return (
      <div className="h-full flex flex-col bg-white overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-success-green" />
            <h2 className="text-base font-semibold text-success-green">Seam Closed!</h2>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="rounded-xl bg-brand-navy text-white px-4 py-3 text-center">
            <p className="text-[10px] text-white/60 mb-0.5">Repair Bonus ATQ</p>
            <p className="text-3xl font-semibold text-brand-teal">+{bonusAtq}</p>
            <p className="text-[10px] text-white/50 mt-0.5">50% of your solve ATQ</p>
          </div>
          <div className="rounded-lg bg-success-greenlite border border-success-green/30 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-success-green uppercase tracking-wider mb-1">
              Why this fixes it
            </p>
            <p className="text-xs text-slate leading-relaxed">{selectedChoice?.explanation}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider mb-1">
              Your fix
            </p>
            <p className="text-xs text-slate italic leading-snug">"{selectedChoice?.text}"</p>
          </div>
          <div className="rounded-lg bg-brand-teallite border border-brand-teal/30 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-brand-tealdk uppercase tracking-wider mb-1">
              ✦ Patched graph
            </p>
            <p className="text-xs text-slate leading-relaxed">
              The canvas now shows the security fix applied. The bypass path is blocked and the new control node is highlighted in green.
            </p>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3 space-y-2">
          <button
            onClick={() => router.push('/puzzles')}
            className="w-full py-2 rounded-lg bg-brand-navy text-white text-xs font-semibold hover:bg-brand-navydk transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Puzzles
          </button>
          <button
            onClick={onBack}
            className="w-full py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-mid hover:text-brand-navy hover:border-brand-navy/30 transition-colors"
          >
            View solve summary
          </button>
        </div>
      </div>
    )
  }

  if (repairPhase === 'wrong') {
    return (
      <div className="h-full flex flex-col bg-white overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-target-red" />
            <h2 className="text-base font-semibold text-target-red">That won&apos;t close the seam</h2>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="rounded-lg bg-target-redlite border border-target-red/30 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-target-red uppercase tracking-wider mb-1">
              Why it doesn&apos;t work
            </p>
            <p className="text-xs text-target-reddk leading-relaxed">{selectedChoice?.explanation}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider mb-1">
              Your choice
            </p>
            <p className="text-xs text-slate italic leading-snug">"{selectedChoice?.text}"</p>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3 space-y-2">
          <button
            onClick={handleRetry}
            className="w-full py-2.5 rounded-lg bg-brand-navy text-white text-xs font-semibold hover:bg-brand-navydk transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <button
            onClick={onBack}
            className="w-full py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-mid hover:text-brand-navy hover:border-brand-navy/30 transition-colors"
          >
            Skip — back to summary
          </button>
        </div>
      </div>
    )
  }

  // ── Selection screen ──────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-semibold text-brand-navy">Fix the Seam</h2>
          </div>
          <button onClick={onBack} className="text-[10px] text-slate-mid hover:text-slate transition-colors">
            ← back
          </button>
        </div>
        <p className="text-[10px] text-slate-mid mt-1 leading-relaxed">
          The breach path is highlighted on the canvas. Which change closes this vulnerability?
        </p>
      </div>

      {/* Choices */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {choices.map((choice, i) => {
          const letter     = CHOICE_LETTERS[i] ?? String(i + 1)
          const isSelected = selected === choice.id
          const isHovered  = hovered === choice.id

          return (
            <button
              key={choice.id}
              onClick={() => setSelected(choice.id)}
              onMouseEnter={() => setHovered(choice.id)}
              onMouseLeave={() => setHovered(null)}
              className={clsx(
                'w-full text-left rounded-lg border-2 px-3 py-2.5 transition-all duration-150',
                isSelected
                  ? 'border-brand-navy bg-brand-navy/5 shadow-sm'
                  : isHovered
                  ? 'border-brand-teal/60 bg-brand-teallite'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5',
                  isSelected ? 'bg-brand-navy text-white' : 'bg-slate-200 text-slate',
                )}>
                  {letter}
                </div>
                <p className={clsx(
                  'text-[11px] font-medium leading-snug',
                  isSelected ? 'text-brand-navy' : 'text-slate',
                )}>
                  {choice.text}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-brand-tealdk mb-2">
          <Zap className="w-3 h-3" />
          Correct fix earns +{Math.max(1, Math.round(baseSolveAtq * 0.5))} ATQ bonus
        </div>
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className={clsx(
            'w-full py-2.5 rounded-lg text-sm font-semibold transition-all',
            selected
              ? 'bg-brand-navy text-white hover:bg-brand-navydk'
              : 'bg-slate-200 text-slate-mid cursor-not-allowed',
          )}
        >
          Confirm Fix
        </button>
      </div>
    </div>
  )
}
