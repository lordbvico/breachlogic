'use client'

import { useState } from 'react'
import type { Puzzle, TokenPlacement } from '@/types/puzzle'
import { TIER_CONFIG, COLORS } from '@/constants/theme'
import clsx from 'clsx'
import { HelpCircle, RotateCcw, CheckCircle } from 'lucide-react'

interface Props {
  puzzle: Puzzle
  placements: TokenPlacement[]
  onPlacementRemove: (nodeId: string) => void
  onConfirm: () => void
  onReset: () => void
  disabled: boolean
  hintsUsed: number
  onHint: () => void
}

export default function ObjectivePanel({
  puzzle,
  placements,
  onPlacementRemove,
  onConfirm,
  onReset,
  disabled,
  hintsUsed,
  onHint,
}: Props) {
  const { tokens, objective, meta } = puzzle
  const tierCfg = TIER_CONFIG[meta.tier]
  const allPlaced = placements.length >= tokens.count
  const maxHints = puzzle.pedagogy.hint_sequence.length

  // Map node IDs to labels for display
  const nodeMap = Object.fromEntries(
    puzzle.map.nodes.map((n) => [n.id, n.label]),
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Objective box */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-1">
          Objective
        </p>
        <div className="rounded-md bg-target-redlite border border-target-red/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-target-red uppercase tracking-wider mb-1">
            Unauthorized target
          </p>
          <p className="text-xs text-target-reddk leading-relaxed">
            {objective.description}
          </p>
        </div>
      </div>

      {/* Token slots */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-2">
          Action Tokens ({tokens.count})
        </p>

        <div className="space-y-2">
          {Array.from({ length: tokens.count }, (_, i) => {
            const placement = placements[i]
            return (
              <div
                key={i}
                className={clsx(
                  'flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-all',
                  placement
                    ? 'border-brand-teal/40 bg-brand-teallite'
                    : 'border-dashed border-slate-300 bg-white',
                )}
              >
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0',
                    placement
                      ? 'bg-brand-navy text-white'
                      : 'bg-brand-teal text-white',
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 min-w-0">
                  {placement ? (
                    <>
                      <p className="font-medium text-brand-navy truncate">
                        {nodeMap[placement.nodeId] ?? placement.nodeId}
                      </p>
                      <p className="text-[10px] text-brand-tealdk">token placed</p>
                    </>
                  ) : (
                    <p className="text-slate-mid italic">
                      {tokens.labels[i] ?? `Token ${i + 1}`}
                    </p>
                  )}
                </div>
                {placement && (
                  <button
                    onClick={() => onPlacementRemove(placement.nodeId)}
                    className="text-slate-mid hover:text-target-red transition-colors"
                    title="Remove token"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 mt-auto">
        <button
          onClick={onConfirm}
          disabled={!allPlaced || disabled}
          className={clsx(
            'w-full py-2.5 rounded-md text-sm font-semibold transition-all',
            allPlaced && !disabled
              ? 'bg-brand-navy text-white hover:bg-brand-navydk'
              : 'bg-slate-200 text-slate-mid cursor-not-allowed',
          )}
        >
          <CheckCircle className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
          Confirm Breach
        </button>

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 py-2 rounded-md text-xs font-medium text-slate-mid border border-slate-200 hover:border-slate-300 hover:text-slate transition-colors"
          >
            <RotateCcw className="inline w-3 h-3 mr-1 -mt-0.5" />
            Reset
          </button>

          <button
            onClick={onHint}
            disabled={hintsUsed >= maxHints}
            className={clsx(
              'flex-1 py-2 rounded-md text-xs font-medium border transition-colors',
              hintsUsed < maxHints
                ? 'text-brand-tealdk border-brand-teal hover:bg-brand-teallite'
                : 'text-slate-mid border-slate-200 cursor-not-allowed',
            )}
          >
            <HelpCircle className="inline w-3 h-3 mr-1 -mt-0.5" />
            {hintsUsed < maxHints ? `Hint (${maxHints - hintsUsed} left)` : 'No hints left'}
          </button>
        </div>
      </div>
    </div>
  )
}
