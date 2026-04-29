'use client'

import type { Puzzle } from '@/types/puzzle'
import type { MCChoice } from '@/lib/puzzle-engine'
import { TIER_CONFIG } from '@/constants/theme'
import { RotateCcw, Zap } from 'lucide-react'
import clsx from 'clsx'

const CHOICE_LETTERS = ['A', 'B', 'C', 'D']

interface Props {
  puzzle: Puzzle
  choices: MCChoice[]
  selected: string | null
  hovered: string | null
  wrongId: string | null    // flashes red when set
  challengeMode?: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onConfirm: () => void
  onReset: () => void
}

export default function MultipleChoicePanel({
  puzzle,
  choices,
  selected,
  hovered,
  wrongId,
  challengeMode = false,
  onSelect,
  onHover,
  onConfirm,
  onReset,
}: Props) {
  const { objective, meta } = puzzle

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Mode badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-0.5">
            Multiple Choice
          </p>
          <p className="text-[10px] text-slate-mid leading-relaxed">
            Hover a path to preview nodes. Select the one that achieves the breach.
          </p>
        </div>
        {challengeMode && (
          <span className="flex items-center gap-0.5 flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gate-amberlite border border-gate-amber/30 text-gate-amberdk">
            <Zap className="w-2.5 h-2.5" />×1.5
          </span>
        )}
      </div>

      {/* Objective reminder */}
      <div className="rounded-md bg-target-redlite border border-target-red/30 px-3 py-2">
        <p className="text-[10px] font-semibold text-target-red uppercase tracking-wider mb-0.5">Target</p>
        <p className="text-[10px] text-target-reddk leading-relaxed">{objective.description}</p>
      </div>

      {/* Choices */}
      <div className="space-y-2 flex-1">
        {choices.map((choice, i) => {
          const letter = CHOICE_LETTERS[i] ?? String(i + 1)
          const isSelected = selected === choice.id
          const isHovered  = hovered === choice.id
          const isWrong    = wrongId === choice.id

          return (
            <button
              key={choice.id}
              onClick={() => onSelect(choice.id)}
              onMouseEnter={() => onHover(choice.id)}
              onMouseLeave={() => onHover(null)}
              className={clsx(
                'w-full text-left rounded-lg border-2 px-3 py-2.5 transition-all duration-150',
                isWrong
                  ? 'border-target-red bg-target-redlite'
                  : isSelected
                  ? 'border-brand-navy bg-brand-navy/5 shadow-sm'
                  : isHovered
                  ? 'border-brand-teal/60 bg-brand-teallite'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5',
                  isWrong
                    ? 'bg-target-red text-white'
                    : isSelected
                    ? 'bg-brand-navy text-white'
                    : 'bg-slate-200 text-slate',
                )}>
                  {letter}
                </div>
                <p className={clsx(
                  'text-[11px] font-medium leading-snug break-words',
                  isWrong   ? 'text-target-red'  :
                  isSelected ? 'text-brand-navy'  :
                  'text-slate',
                )}>
                  {choice.label}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="space-y-2 mt-auto">
        <button
          onClick={onConfirm}
          disabled={!selected}
          className={clsx(
            'w-full py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-1.5',
            selected
              ? 'bg-brand-navy text-white hover:bg-brand-navydk'
              : 'bg-slate-200 text-slate-mid cursor-not-allowed',
          )}
        >
          Submit Answer
        </button>
        <button
          onClick={onReset}
          className="w-full py-2 rounded-md text-xs font-medium text-slate-mid border border-slate-200 hover:border-slate-300 hover:text-slate transition-colors flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
    </div>
  )
}
