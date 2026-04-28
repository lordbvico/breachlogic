'use client'

import { useState } from 'react'
import type { PuzzleRule } from '@/types/puzzle'
import clsx from 'clsx'

interface Props {
  rules: PuzzleRule[]
  highlightedGateId?: string
}

export default function RuleSetPanel({ rules, highlightedGateId }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-1">
        Rule Set
      </p>

      {rules.map((rule) => {
        const isHighlighted = rule.gate_id === highlightedGateId
        const isExpanded = expanded === rule.id

        return (
          <button
            key={rule.id}
            onClick={() => setExpanded(isExpanded ? null : rule.id)}
            className={clsx(
              'w-full text-left rounded-md border px-3 py-2 transition-all duration-150',
              isHighlighted
                ? 'border-gate-amber bg-gate-amberlite'
                : 'border-slate-200 bg-white hover:border-brand-teal',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    'text-[10px] font-semibold uppercase tracking-wider block mb-0.5',
                    isHighlighted ? 'text-gate-amber' : 'text-brand-tealdk',
                  )}
                >
                  {rule.id}
                </span>
                <span className="text-xs font-medium text-brand-navy block">{rule.label}</span>
              </div>
              <span className="text-slate-mid text-xs mt-0.5">{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                <div>
                  <span className="text-[10px] font-semibold text-slate-mid uppercase tracking-wide">
                    If
                  </span>
                  <p className="text-xs text-slate mt-0.5">{rule.condition}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-mid uppercase tracking-wide">
                    Then
                  </span>
                  <p className="text-xs text-slate mt-0.5">{rule.effect}</p>
                </div>
              </div>
            )}
          </button>
        )
      })}

      {/* Seam callout */}
      {highlightedGateId && (
        <div className="mt-2 rounded-md bg-brand-teallite border border-brand-teal/30 px-3 py-2">
          <p className="text-[10px] font-semibold text-brand-tealdk uppercase tracking-wider mb-1">
            Seam hint
          </p>
          <p className="text-[11px] text-slate leading-relaxed">
            Look for the interaction between highlighted rules — the gap exists between policies,
            not within any single one.
          </p>
        </div>
      )}
    </div>
  )
}
