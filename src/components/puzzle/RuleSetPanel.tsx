'use client'

import { useState } from 'react'
import type { PuzzleRule } from '@/types/puzzle'
import clsx from 'clsx'

interface Props {
  rules: PuzzleRule[]
  highlightedGateId?: string
}

export default function RuleSetPanel({ rules, highlightedGateId }: Props) {
  // Start with first rule expanded so players immediately see a rule's structure
  const [expanded, setExpanded] = useState<string | null>(rules[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid">
          Policy Rules
        </p>
        <p className="text-[9px] text-slate-mid mt-0.5 leading-relaxed">
          Find the gap. One rule contains a logical flaw the attacker can exploit.
        </p>
      </div>

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
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={clsx(
                      'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                      isHighlighted
                        ? 'bg-gate-amber/20 text-gate-amber'
                        : 'bg-slate-100 text-slate-mid',
                    )}
                  >
                    {rule.id}
                  </span>
                  {isHighlighted && (
                    <span className="text-[9px] text-gate-amber font-medium">⚠ examine this</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-brand-navy block leading-snug">
                  {rule.label}
                </span>
              </div>
              <span className="text-slate-mid text-[10px] mt-0.5 flex-shrink-0">
                {isExpanded ? '▲' : '▼'}
              </span>
            </div>

            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                <div className="rounded bg-brand-teallite px-2 py-1.5">
                  <span className="text-[9px] font-bold text-brand-tealdk uppercase tracking-wide block mb-0.5">
                    IF (condition)
                  </span>
                  <p className="text-[11px] text-slate leading-snug">{rule.condition}</p>
                </div>
                <div className="rounded bg-target-redlite px-2 py-1.5">
                  <span className="text-[9px] font-bold text-target-red uppercase tracking-wide block mb-0.5">
                    THEN (effect)
                  </span>
                  <p className="text-[11px] text-target-reddk leading-snug">{rule.effect}</p>
                </div>
              </div>
            )}
          </button>
        )
      })}

      {/* Seam callout — shown when a highlighted gate is present */}
      {highlightedGateId && (
        <div className="mt-1 rounded-md bg-brand-teallite border border-brand-teal/30 px-3 py-2">
          <p className="text-[10px] font-semibold text-brand-tealdk uppercase tracking-wider mb-1">
            Seam hint
          </p>
          <p className="text-[10px] text-slate leading-relaxed">
            Look for a case the highlighted rule does <em>not</em> cover — the gap
            often exists between two rules interacting, not within a single one.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-slate-100">
        <p className="text-[9px] font-semibold text-slate-mid uppercase tracking-wider mb-1.5">
          Node types
        </p>
        <div className="space-y-1">
          {[
            { color: 'bg-blue-500',   label: 'Actor',   desc: 'Attacker entry point' },
            { color: 'bg-amber-500',  label: 'Gate',    desc: 'Policy check' },
            { color: 'bg-teal-500',   label: 'Process', desc: 'Service / handler' },
            { color: 'bg-purple-500', label: 'System',  desc: 'System execution' },
            { color: 'bg-red-500',    label: 'Target',  desc: 'Protected resource' },
          ].map(({ color, label, desc }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', color)} />
              <span className="text-[10px] text-slate-mid">
                <span className="font-medium">{label}</span> — {desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
