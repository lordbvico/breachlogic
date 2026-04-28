'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { Puzzle, TokenPlacement, PuzzlePhase } from '@/types/puzzle'
import { COLORS, TIER_CONFIG } from '@/constants/theme'
import { validateBreach, formatElapsed } from '@/lib/puzzle-engine'
import RuleSetPanel from './RuleSetPanel'
import ObjectivePanel from './ObjectivePanel'
import BreachOverlay from './BreachOverlay'
import clsx from 'clsx'

// ── Custom Node Types ─────────────────────────────────────────────────────────

interface BLNodeData {
  label: string
  sublabel?: string
  nodeType: string
  privilege?: string
  locked?: boolean
  tokenSlot?: boolean
  selected?: boolean
  onToken?: (id: string) => void
  id: string
}

function BLNode({ data }: { data: BLNodeData }) {
  const colorMap = COLORS.node as Record<string, { bg: string; border: string; text: string }>
  const colors = colorMap[data.nodeType] ?? colorMap.process
  const isSelectable = data.tokenSlot && !data.locked
  const isSelected = data.selected

  return (
    <>
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <div
        onClick={() => isSelectable && data.onToken?.(data.id)}
        className={clsx(
          'rounded-[6px] border-2 px-3 py-2 text-center transition-all duration-150 min-w-[100px] max-w-[130px]',
          isSelectable && 'cursor-pointer hover:shadow-md',
          isSelectable && !isSelected && 'hover:ring-2 hover:ring-offset-1 hover:ring-[#00BCD4]',
          isSelected && 'ring-2 ring-[#00BCD4] ring-offset-1 shadow-md',
          data.locked && 'opacity-60',
        )}
        style={{
          background: isSelected ? '#E0F7FA' : colors.bg,
          borderColor: isSelected ? '#00BCD4' : colors.border,
        }}
      >
        {/* Token indicator */}
        {isSelected && (
          <div
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[9px] font-bold shadow"
          >
            ✓
          </div>
        )}

        <p
          className="text-[11px] font-semibold leading-tight"
          style={{ color: colors.border }}
        >
          {data.label}
        </p>
        {data.sublabel && (
          <p className="text-[9px] mt-0.5 leading-tight" style={{ color: colors.text }}>
            {data.sublabel}
          </p>
        )}

        {/* Lock indicator for target node */}
        {data.locked && data.nodeType === 'target' && (
          <p className="text-[9px] mt-1 text-target-red font-medium">🔒 LOCKED</p>
        )}

        {/* Selectable indicator */}
        {isSelectable && !isSelected && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00BCD4] opacity-60" />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </>
  )
}

const NODE_TYPES: NodeTypes = { bl: BLNode }

// ── Edge styling by type ──────────────────────────────────────────────────────

function edgeStyleForType(type?: string, blocked?: boolean): Partial<Edge> {
  if (blocked) return {
    style: { stroke: COLORS.target.red, strokeDasharray: '5 4', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.target.red },
    animated: false,
  }
  if (type === 'bypass' || type === 'trigger') return {
    style: { stroke: COLORS.gate.warn, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.gate.warn },
    animated: true,
  }
  return {
    style: { stroke: COLORS.slate.mid, strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.slate.mid },
    animated: false,
  }
}

// ── Convert puzzle data → React Flow nodes/edges ──────────────────────────────

function buildRFNodes(
  puzzle: Puzzle,
  placements: TokenPlacement[],
  onToken: (id: string) => void,
): Node[] {
  const placedIds = new Set(placements.map((p) => p.nodeId))

  return puzzle.map.nodes.map((n) => ({
    id: n.id,
    type: 'bl',
    position: n.position,
    data: {
      id: n.id,
      label: n.label,
      sublabel: n.sublabel,
      nodeType: n.type,
      privilege: n.privilege,
      locked: n.locked,
      tokenSlot: n.token_slot !== false,
      selected: placedIds.has(n.id),
      onToken,
    } satisfies BLNodeData,
    draggable: false,
    selectable: false,
  }))
}

function buildRFEdges(puzzle: Puzzle, solvePath?: string[]): Edge[] {
  const solveSet = solvePath ? new Set(solvePath) : new Set<string>()

  return puzzle.map.edges.map((e, i) => {
    const isOnSolvePath =
      solvePath && solveSet.has(e.from) && solveSet.has(e.to)
    const style = isOnSolvePath
      ? {
          style: { stroke: COLORS.success.green, strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.success.green },
          animated: true,
        }
      : edgeStyleForType(e.type, !!e.blocked_by)

    return {
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      label: e.label,
      labelStyle: { fontSize: 9, fill: COLORS.slate.mid },
      labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
      ...style,
    }
  })
}

// ── Main PuzzleCanvas ─────────────────────────────────────────────────────────

interface Props {
  puzzle: Puzzle
}

export default function PuzzleCanvas({ puzzle }: Props) {
  const [placements, setPlacements]       = useState<TokenPlacement[]>([])
  const [phase, setPhase]                 = useState<PuzzlePhase>('playing')
  const [hintsUsed, setHintsUsed]         = useState(0)
  const [currentHint, setCurrentHint]     = useState<string | null>(null)
  const [solvePath, setSolvePath]         = useState<string[] | undefined>()
  const [wrongShake, setWrongShake]       = useState(false)
  const startTime                         = useRef(Date.now())
  const [elapsed, setElapsed]             = useState(0)
  const [timer, setTimer]                 = useState(puzzle.meta.estimated_minutes * 60)

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1))
      setElapsed(Date.now() - startTime.current)
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const handleToken = useCallback(
    (nodeId: string) => {
      if (phase !== 'playing') return
      setPlacements((prev) => {
        const exists = prev.findIndex((p) => p.nodeId === nodeId)
        if (exists !== -1) {
          // Remove
          return prev.filter((_, i) => i !== exists)
        }
        if (prev.length >= puzzle.tokens.count) return prev
        return [...prev, { tokenIndex: prev.length, nodeId }]
      })
    },
    [phase, puzzle.tokens.count],
  )

  const handleConfirm = useCallback(() => {
    const result = validateBreach(puzzle, placements)
    if (result.valid) {
      setSolvePath(result.pathFound)
      setPhase('breach-confirmed')
    } else {
      setWrongShake(true)
      setPhase('confirmed-wrong')
      setTimeout(() => {
        setWrongShake(false)
        setPhase('playing')
      }, 1500)
    }
  }, [puzzle, placements])

  const handleReset = useCallback(() => {
    setPlacements([])
    setPhase('playing')
    setSolvePath(undefined)
    setCurrentHint(null)
    setWrongShake(false)
  }, [])

  const handleHint = useCallback(() => {
    const hints = puzzle.pedagogy.hint_sequence
    if (hintsUsed < hints.length) {
      setCurrentHint(hints[hintsUsed].prompt)
      setHintsUsed((h) => h + 1)
    }
  }, [hintsUsed, puzzle.pedagogy.hint_sequence])

  const handleRemovePlacement = useCallback((nodeId: string) => {
    setPlacements((prev) => prev.filter((p) => p.nodeId !== nodeId))
  }, [])

  // Derive React Flow nodes/edges from puzzle state — no internal RF state needed
  // since placement logic is managed outside React Flow
  const syncedNodes = buildRFNodes(puzzle, placements, handleToken)
  const syncedEdges = buildRFEdges(puzzle, solvePath)

  const timerMins = Math.floor(timer / 60)
  const timerSecs = timer % 60

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-navy text-white text-sm border-b border-white/10">
        <span className="font-semibold truncate">{puzzle.meta.title}</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
          style={{
            background: TIER_CONFIG[puzzle.meta.tier]?.bgColor ?? '#EAF3DE',
            color: TIER_CONFIG[puzzle.meta.tier]?.color ?? '#3B6D11',
          }}
        >
          {puzzle.meta.tier_label}
        </span>
        <span className="ml-auto text-brand-teal font-mono text-sm tabular-nums">
          {timerMins}:{String(timerSecs).padStart(2, '0')}
        </span>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left — Rule Set */}
        <aside className="w-52 flex-shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto p-3">
          <RuleSetPanel
            rules={puzzle.rules}
            highlightedGateId={puzzle.meta.tier >= 4 ? puzzle.rules[puzzle.rules.length - 1]?.gate_id : undefined}
          />
        </aside>

        {/* Center — Node Graph */}
        <div
          className={clsx(
            'flex-1 min-w-0 relative',
            wrongShake && 'animate-breach-pulse',
            phase === 'confirmed-wrong' && 'bg-red-50/50',
          )}
        >
          {wrongShake && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-target-red text-white text-xs font-semibold px-3 py-1.5 rounded-full animate-slide-up">
              No valid breach path — try again
            </div>
          )}

          <ReactFlow
            nodes={syncedNodes}
            edges={syncedEdges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            minZoom={0.4}
            maxZoom={2}
            className="bg-white"
          >
            <Background color="#e2e8f0" gap={20} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(n) => {
                const type = (n.data as unknown as BLNodeData).nodeType
                const colors = COLORS.node as Record<string, { bg: string; border: string; text: string }>
                return colors[type]?.border ?? COLORS.slate.mid
              }}
              maskColor="rgba(255,255,255,0.8)"
              style={{ border: '0.5px solid #e2e8f0' }}
            />
          </ReactFlow>

          {/* Hint bubble */}
          {currentHint && (
            <div className="absolute bottom-4 left-4 right-4 bg-brand-teallite border border-brand-teal/40 rounded-lg px-4 py-2.5 text-xs text-slate shadow-sm animate-slide-up">
              <span className="font-semibold text-brand-tealdk">Hint: </span>
              {currentHint}
            </div>
          )}

          {/* Breach overlay */}
          {phase === 'breach-confirmed' && (
            <BreachOverlay
              puzzle={puzzle}
              placements={placements}
              elapsedMs={elapsed}
              hintsUsed={hintsUsed}
              onPlayAgain={handleReset}
            />
          )}
        </div>

        {/* Right — Objective + Tokens */}
        <aside className="w-48 flex-shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto p-3">
          <ObjectivePanel
            puzzle={puzzle}
            placements={placements}
            onPlacementRemove={handleRemovePlacement}
            onConfirm={handleConfirm}
            onReset={handleReset}
            disabled={phase === 'confirmed-wrong'}
            hintsUsed={hintsUsed}
            onHint={handleHint}
          />
        </aside>
      </div>
    </div>
  )
}

