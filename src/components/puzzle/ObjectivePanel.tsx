'use client'

import { useState } from 'react'
import type { Puzzle, TokenPlacement } from '@/types/puzzle'
import { TIER_CONFIG } from '@/constants/theme'
import clsx from 'clsx'
import { HelpCircle, RotateCcw, Crosshair, Loader2, Zap, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

interface Props {
  puzzle: Puzzle
  placements: TokenPlacement[]
  onPlacementRemove: (nodeId: string) => void
  onConfirm: () => void
  onReset: () => void
  disabled: boolean
  hintsUsed: number
  hintLoading: boolean
  onHint: () => void
  challengeMode?: boolean
}

export default function ObjectivePanel({
  puzzle,
  placements,
  onPlacementRemove,
  onConfirm,
  onReset,
  disabled,
  hintsUsed,
  hintLoading,
  onHint,
  challengeMode = false,
}: Props) {
  const { tokens, objective, meta, narrative } = puzzle
  const allPlaced = placements.length >= tokens.count
  const maxHints = puzzle.pedagogy.hint_sequence.length
  const [scenarioExpanded, setScenarioExpanded] = useState(true)

  const nodeMap = Object.fromEntries(
    puzzle.map.nodes.map((n) => [n.id, n.label]),
  )

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* Challenge mode badge */}
      {challengeMode && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gate-amberlite border border-gate-amber/30">
          <Zap className="w-3.5 h-3.5 text-gate-amber flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-gate-amberdk">Challenge Mode</p>
            <p className="text-[9px] text-gate-amber/80">No hints · ×1.5 ATQ bonus</p>
          </div>
        </div>
      )}

      {/* Scenario — collapsible */}
      <div className="rounded-md border border-brand-teal/30 bg-brand-teallite overflow-hidden">
        <button
          onClick={() => setScenarioExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-left"
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-brand-tealdk flex-shrink-0" />
            <span className="text-[10px] font-semibold text-brand-tealdk uppercase tracking-wider">
              Scenario
            </span>
          </div>
          {scenarioExpanded
            ? <ChevronUp className="w-3 h-3 text-brand-tealdk/60" />
            : <ChevronDown className="w-3 h-3 text-brand-tealdk/60" />}
        </button>
        {scenarioExpanded && (
          <div className="px-3 pb-2.5">
            <p className="text-[11px] text-slate leading-relaxed">{narrative.scenario}</p>
          </div>
        )}
      </div>

      {/* How to play — always visible */}
      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
        <p className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider mb-1">How to play</p>
        <p className="text-[10px] text-slate-mid leading-relaxed">
          Read the rules on the left. Place <span className="font-semibold text-brand-navy">{tokens.count} token{tokens.count !== 1 ? 's' : ''}</span> on
          the nodes that form the exploit path from attacker to target, then hit <span className="font-semibold text-brand-navy">Execute Breach</span>.
        </p>
      </div>

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
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-1.5">
          Breach Path ({placements.length}/{tokens.count} placed)
        </p>

        <div className="space-y-1.5">
          {Array.from({ length: tokens.count }, (_, i) => {
            const placement = placements[i]
            return (
              <div
                key={i}
                className={clsx(
                  'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all',
                  placement
                    ? 'border-brand-teal/40 bg-brand-teallite'
                    : 'border-dashed border-slate-300 bg-white',
                )}
              >
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0',
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
                      <p className="font-medium text-brand-navy truncate text-[11px]">
                        {nodeMap[placement.nodeId] ?? placement.nodeId}
                      </p>
                      <p className="text-[9px] text-brand-tealdk">token placed</p>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-mid italic">
                      {tokens.labels[i] ?? `Step ${i + 1} — click a node`}
                    </p>
                  )}
                </div>
                {placement && (
                  <button
                    onClick={() => onPlacementRemove(placement.nodeId)}
                    className="text-slate-mid hover:text-target-red transition-colors text-xs"
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
            'w-full py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-1.5',
            allPlaced && !disabled
              ? 'bg-brand-navy text-white hover:bg-brand-navydk'
              : 'bg-slate-200 text-slate-mid cursor-not-allowed',
          )}
        >
          <Crosshair className="w-3.5 h-3.5" />
          Execute Breach
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
            disabled={hintsUsed >= maxHints || hintLoading || challengeMode}
            title={challengeMode ? 'Hints disabled in Challenge Mode' : undefined}
            className={clsx(
              'flex-1 py-2 rounded-md text-xs font-medium border transition-colors',
              challengeMode
                ? 'text-slate-mid border-slate-200 cursor-not-allowed opacity-40'
                : hintsUsed < maxHints && !hintLoading
                ? 'text-brand-tealdk border-brand-teal hover:bg-brand-teallite'
                : 'text-slate-mid border-slate-200 cursor-not-allowed',
            )}
          >
            {hintLoading
              ? <Loader2 className="inline w-3 h-3 mr-1 -mt-0.5 animate-spin" />
              : <HelpCircle className="inline w-3 h-3 mr-1 -mt-0.5" />}
            {challengeMode
              ? 'No hints'
              : hintLoading
              ? 'Thinking…'
              : hintsUsed < maxHints
              ? `Hint (${maxHints - hintsUsed} left)`
              : 'No hints left'}
          </button>
        </div>
      </div>
    </div>
  )
}
