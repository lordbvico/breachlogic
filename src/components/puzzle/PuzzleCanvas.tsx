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
import { COLORS, TIER_CONFIG, DOMAIN_ICONS } from '@/constants/theme'
import {
  validateBreach,
  computeAtqDelta,
  generateMCChoices,
  generateRepairChoices,
  buildRepairVisualization,
  type MCChoice,
  type RepairChoice,
  type RepairVisualization,
} from '@/lib/puzzle-engine'
import RuleSetPanel from './RuleSetPanel'
import ObjectivePanel from './ObjectivePanel'
import BreachOverlay from './BreachOverlay'
import MultipleChoicePanel from './MultipleChoicePanel'
import RepairModePanel from './RepairModePanel'
import clsx from 'clsx'
import { Info, X, Zap, ListChecks, BookOpen, ChevronUp } from 'lucide-react'

// ── Custom Node Types ─────────────────────────────────────────────────────────

interface BLNodeData {
  label: string
  sublabel?: string
  nodeType: string
  privilege?: string
  locked?: boolean
  tokenSlot?: boolean
  selected?: boolean
  onSolvePath?: boolean
  previewPath?: boolean
  isRepairFix?: boolean
  onToken?: (id: string) => void
  id: string
}

function BLNode({ data }: { data: BLNodeData }) {
  const colorMap = COLORS.node as Record<string, { bg: string; border: string; text: string }>
  const colors = colorMap[data.nodeType] ?? colorMap.process
  const isSelectable = data.tokenSlot && !data.locked
  const isSelected  = data.selected
  const isOnPath    = data.onSolvePath && !isSelected
  const isPreview   = data.previewPath && !isSelected && !isOnPath
  const isRepairFix = data.isRepairFix

  return (
    <>
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <div
        onClick={() => isSelectable && data.onToken?.(data.id)}
        className={clsx(
          'rounded-[6px] border-2 px-3 py-3 text-center transition-all duration-150 min-w-[120px] max-w-[160px]',
          isSelectable && 'cursor-pointer hover:shadow-md active:scale-95',
          isSelectable && !isSelected && !isOnPath && !isPreview && 'hover:ring-2 hover:ring-offset-1 hover:ring-[#00BCD4]',
          isSelected   && 'ring-2 ring-[#00BCD4] ring-offset-1 shadow-md',
          isOnPath     && 'ring-2 ring-offset-1 shadow-lg',
          isPreview    && 'ring-2 ring-offset-1 shadow-md',
          isRepairFix  && 'ring-2 ring-offset-1 shadow-lg animate-pulse',
          data.locked  && 'opacity-60',
        )}
        style={{
          background: isRepairFix
            ? COLORS.success.greenLight
            : isSelected
            ? '#E0F7FA'
            : isOnPath
            ? COLORS.success.greenLight
            : isPreview
            ? '#FFF8E1'
            : colors.bg,
          borderColor: isRepairFix
            ? COLORS.success.green
            : isSelected
            ? COLORS.brand.teal
            : isOnPath
            ? COLORS.success.green
            : isPreview
            ? COLORS.gate.warn
            : colors.border,
          ...(isOnPath    ? { '--tw-ring-color': COLORS.success.green } as React.CSSProperties : {}),
          ...(isPreview   ? { '--tw-ring-color': COLORS.gate.warn    } as React.CSSProperties : {}),
          ...(isRepairFix ? { '--tw-ring-color': COLORS.success.green } as React.CSSProperties : {}),
        }}
      >
        {/* Token placed indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-bold shadow">
            ✓
          </div>
        )}
        {/* Solution path indicator */}
        {isOnPath && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-success-green text-white flex items-center justify-center text-[10px] font-bold shadow">
            →
          </div>
        )}
        {/* Repair fix badge */}
        {isRepairFix && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-success-green text-white flex items-center justify-center text-[9px] font-bold shadow">
            ✦
          </div>
        )}
        {/* MC preview indicator */}
        {isPreview && (
          <div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow"
            style={{ background: COLORS.gate.warn }}
          >
            ?
          </div>
        )}

        <p className="text-xs font-semibold leading-tight" style={{ color: colors.border }}>
          {data.label}
        </p>
        {data.sublabel && (
          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: colors.text }}>
            {data.sublabel}
          </p>
        )}

        {data.locked && data.nodeType === 'target' && (
          <p className="text-[10px] mt-1 text-target-red font-medium">🔒 LOCKED</p>
        )}

        {isSelectable && !isSelected && !isOnPath && !isPreview && (
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

// ── Edge styling ──────────────────────────────────────────────────────────────

function edgeStyleForType(type?: string, blocked?: boolean): Partial<Edge> {
  if (blocked) return {
    type: 'smoothstep',
    style: { stroke: COLORS.target.red, strokeDasharray: '6 4', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.target.red },
    animated: false,
  }
  if (type === 'bypass') return {
    type: 'smoothstep',
    // Dashed = circumvents a gate, visually distinct from normal flow
    style: { stroke: COLORS.gate.warn, strokeWidth: 2.5, strokeDasharray: '8 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.gate.warn },
    animated: true,
  }
  if (type === 'trigger') return {
    type: 'smoothstep',
    // Solid purple = activates / kicks off a side-effect
    style: { stroke: '#7B1FA2', strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#7B1FA2' },
    animated: true,
  }
  return {
    type: 'smoothstep',
    style: { stroke: '#475569', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
    animated: false,
  }
}

// ── Convert puzzle data → React Flow nodes/edges ──────────────────────────────

function buildRFNodes(
  puzzle: Puzzle,
  placements: TokenPlacement[],
  onToken: (id: string) => void,
  solvePath?: string[],
  previewPath?: string[],
  repairViz?: RepairVisualization,
): Node[] {
  const placedIds  = new Set(placements.map((p) => p.nodeId))
  const solveSet   = solvePath   ? new Set(solvePath)   : new Set<string>()
  const previewSet = previewPath ? new Set(previewPath) : new Set<string>()
  const repairIds  = new Set(repairViz?.nodes.map((n) => n.id) ?? [])

  const allNodes = [
    ...puzzle.map.nodes,
    ...(repairViz?.nodes ?? []),
  ]

  return allNodes.map((n) => ({
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
      // Gates AND processes are always token-slottable (non-locked)
      tokenSlot: !n.locked && (n.type === 'gate' || n.type === 'process' || n.token_slot !== false),
      selected: placedIds.has(n.id),
      onSolvePath: solveSet.has(n.id),
      previewPath: previewSet.has(n.id),
      isRepairFix: repairIds.has(n.id),
      onToken,
    } satisfies BLNodeData,
    draggable: false,
  }))
}

function buildRFEdges(
  puzzle: Puzzle,
  solvePath?: string[],
  previewPath?: string[],
  revealed = false,
  repairViz?: RepairVisualization,
): Edge[] {
  const solveSet     = solvePath   ? new Set(solvePath)   : new Set<string>()
  const previewSet   = previewPath ? new Set(previewPath) : new Set<string>()
  const blockedSet   = new Set(repairViz?.blockedEdgeIds ?? [])

  const allEdges = [
    ...puzzle.map.edges,
    ...(repairViz?.edges ?? []),
  ]

  return allEdges.map((e, i) => {
    const edgeId = `e-${i}`
    const isOnSolvePath   = solvePath   && solveSet.has(e.from)   && solveSet.has(e.to)
    const isOnPreviewPath = previewPath && previewSet.has(e.from) && previewSet.has(e.to)
    // Repair fix edge — green dashed to signal it closes the seam
    const isRepairEdge    = repairViz?.edges.some((re) => re.from === e.from && re.to === e.to) ?? false
    // Bypass edges from original puzzle that are now blocked by the fix
    const isBlockedByFix  = blockedSet.has(edgeId) && repairViz !== undefined

    // Bypass/trigger: only show special style after answer is submitted (revealed)
    const effectiveType = revealed ? e.type : (e.type === 'bypass' || e.type === 'trigger') ? 'flow' : e.type

    const style = isRepairEdge
      ? {
          type: 'smoothstep',
          style: { stroke: COLORS.success.green, strokeWidth: 2, strokeDasharray: '6 3' },
          markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.success.green },
          animated: true,
        }
      : isBlockedByFix
      ? {
          type: 'smoothstep',
          style: { stroke: COLORS.target.red, strokeWidth: 2, strokeDasharray: '4 4', opacity: 0.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.target.red },
          animated: false,
        }
      : isOnSolvePath
      ? {
          type: 'smoothstep',
          style: { stroke: COLORS.success.green, strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.success.green },
          animated: true,
        }
      : isOnPreviewPath
      ? {
          type: 'smoothstep',
          style: { stroke: COLORS.gate.warn, strokeWidth: 2.5, strokeDasharray: '5 3' },
          markerEnd: { type: MarkerType.ArrowClosed, color: COLORS.gate.warn },
          animated: true,
        }
      : edgeStyleForType(effectiveType, !!e.blocked_by)

    return {
      id: edgeId,
      source: e.from,
      target: e.to,
      label: e.label ?? '',
      labelStyle: { fontSize: 9, fill: '#475569', fontWeight: 500 },
      labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      ...style,
    }
  })
}

// ── Main PuzzleCanvas ─────────────────────────────────────────────────────────

type GameMode = 'standard' | 'mc'

interface Props {
  puzzle: Puzzle
}

export default function PuzzleCanvas({ puzzle }: Props) {
  const [placements, setPlacements]   = useState<TokenPlacement[]>([])
  const [phase, setPhase]             = useState<PuzzlePhase>('playing')
  const [hintsUsed, setHintsUsed]     = useState(0)
  const [currentHint, setCurrentHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [solvePath, setSolvePath]     = useState<string[] | undefined>()
  const [wrongShake, setWrongShake]   = useState(false)
  const [showBrief, setShowBrief]     = useState(false)
  const [challengeMode, setChallengeMode] = useState(false)
  const startTime                     = useRef(Date.now())
  const [elapsed, setElapsed]         = useState(0)
  const [timer, setTimer]             = useState(puzzle.meta.estimated_minutes * 60)

  // Multiple Choice state
  const [gameMode, setGameMode]       = useState<GameMode>('standard')
  const [mcChoices]                   = useState<MCChoice[]>(() => generateMCChoices(puzzle))
  const [mcSelected, setMcSelected]   = useState<string | null>(null)
  const [mcHovered, setMcHovered]     = useState<string | null>(null)
  const [mcWrongId, setMcWrongId]     = useState<string | null>(null)

  // Repair Mode state
  const [repairChoices]                  = useState<RepairChoice[]>(() => generateRepairChoices(puzzle))
  const [repairActive, setRepairActive]  = useState(false)
  const [repairConfirmed, setRepairConfirmed] = useState(false)

  // Mobile responsive state
  const [isMobile, setIsMobile]               = useState(false)
  const [showMobileRules, setShowMobileRules]       = useState(false)
  const [showMobileObjective, setShowMobileObjective] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Auto-open objective sheet on mobile when breach is confirmed
  useEffect(() => {
    if (phase === 'breach-confirmed' && isMobile) {
      setShowMobileObjective(true)
    }
  }, [phase, isMobile])

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
      if (phase !== 'playing' || gameMode === 'mc') return
      setPlacements((prev) => {
        const exists = prev.findIndex((p) => p.nodeId === nodeId)
        if (exists !== -1) return prev.filter((_, i) => i !== exists)
        if (prev.length >= puzzle.tokens.count) return prev
        return [...prev, { tokenIndex: prev.length, nodeId }]
      })
    },
    [phase, puzzle.tokens.count, gameMode],
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

  const handleMCConfirm = useCallback(() => {
    if (!mcSelected) return
    const choice = mcChoices.find((c) => c.id === mcSelected)
    if (!choice) return

    if (choice.isCorrect) {
      setSolvePath(choice.nodeIds)
      setPhase('breach-confirmed')
    } else {
      setMcWrongId(mcSelected)
      setTimeout(() => {
        setMcWrongId(null)
      }, 1500)
    }
  }, [mcSelected, mcChoices])

  const handleReset = useCallback(() => {
    setPlacements([])
    setPhase('playing')
    setSolvePath(undefined)
    setCurrentHint(null)
    setWrongShake(false)
    setMcSelected(null)
    setMcHovered(null)
    setMcWrongId(null)
    setRepairActive(false)
    setRepairConfirmed(false)
    startTime.current = Date.now()
    setTimer(puzzle.meta.estimated_minutes * 60)
    setElapsed(0)
  }, [puzzle.meta.estimated_minutes])

  const handleHint = useCallback(async () => {
    if (challengeMode) return
    const maxHints = puzzle.pedagogy.hint_sequence.length
    if (hintsUsed >= maxHints) return

    setHintLoading(true)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleTitle: puzzle.meta.title,
          scenario: puzzle.narrative.scenario,
          rules: puzzle.rules.map((r) => ({
            id: r.id,
            condition: r.condition,
            effect: r.effect,
          })),
          nodes: puzzle.map.nodes.map((n) => ({ label: n.label, type: n.type })),
          objective: puzzle.objective.description,
          hintLevel: hintsUsed + 1,
          previousHints: puzzle.pedagogy.hint_sequence
            .slice(0, hintsUsed)
            .map((h) => h.prompt),
        }),
      })

      if (res.ok) {
        const { hint } = await res.json()
        setCurrentHint(hint)
      } else {
        setCurrentHint(puzzle.pedagogy.hint_sequence[hintsUsed].prompt)
      }
    } catch {
      setCurrentHint(puzzle.pedagogy.hint_sequence[hintsUsed].prompt)
    } finally {
      setHintLoading(false)
      setHintsUsed((h) => h + 1)
    }
  }, [challengeMode, hintsUsed, puzzle])

  const handleRemovePlacement = useCallback((nodeId: string) => {
    setPlacements((prev) => prev.filter((p) => p.nodeId !== nodeId))
  }, [])

  // Derive preview path from MC hover
  const previewPath = gameMode === 'mc' && mcHovered
    ? (mcChoices.find((c) => c.id === mcHovered)?.nodeIds ?? undefined)
    : undefined

  // Bypass edges are only styled after the answer is submitted
  const bypassRevealed = phase === 'breach-confirmed' || phase === 'confirmed-wrong'

  // Repair visualization — only active after the correct fix is confirmed
  const repairViz: RepairVisualization | undefined = repairConfirmed
    ? buildRepairVisualization(puzzle)
    : undefined

  const syncedNodes = buildRFNodes(puzzle, placements, handleToken, solvePath, previewPath, repairViz)
  const syncedEdges = buildRFEdges(puzzle, solvePath, previewPath, bypassRevealed, repairViz)

  const timerMins = Math.floor(timer / 60)
  const timerSecs = timer % 60
  const timerWarning = timer < 60 && phase === 'playing'

  // Right panel width (desktop)
  const rightPanelWidth = phase === 'breach-confirmed'
    ? 'w-80'
    : gameMode === 'mc'
    ? 'w-64'
    : 'w-48'

  // Shared right-panel content (used by both desktop aside and mobile bottom sheet)
  const rightPanelContent = phase === 'breach-confirmed' ? (
    repairActive ? (
      <RepairModePanel
        puzzle={puzzle}
        choices={repairChoices}
        baseSolveAtq={(() => {
          const base = computeAtqDelta(puzzle.meta.tier, hintsUsed, elapsed, puzzle.meta.estimated_minutes)
          return challengeMode ? Math.round(base * 1.5) : gameMode === 'mc' ? Math.round(base * 0.75) : base
        })()}
        onBack={() => setRepairActive(false)}
        onRepairConfirmed={() => setRepairConfirmed(true)}
      />
    ) : (
      <BreachOverlay
        puzzle={puzzle}
        placements={placements}
        elapsedMs={elapsed}
        hintsUsed={hintsUsed}
        challengeMode={challengeMode}
        mcMode={gameMode === 'mc'}
        onPlayAgain={handleReset}
        onStartRepair={() => setRepairActive(true)}
      />
    )
  ) : gameMode === 'mc' ? (
    <MultipleChoicePanel
      puzzle={puzzle}
      choices={mcChoices}
      selected={mcSelected}
      hovered={mcHovered}
      wrongId={mcWrongId}
      challengeMode={challengeMode}
      onSelect={setMcSelected}
      onHover={setMcHovered}
      onConfirm={handleMCConfirm}
      onReset={handleReset}
    />
  ) : (
    <ObjectivePanel
      puzzle={puzzle}
      placements={placements}
      onPlacementRemove={handleRemovePlacement}
      onConfirm={handleConfirm}
      onReset={handleReset}
      disabled={phase === 'confirmed-wrong'}
      hintsUsed={hintsUsed}
      hintLoading={hintLoading}
      onHint={handleHint}
      challengeMode={challengeMode}
    />
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-navy text-white text-sm border-b border-white/10 flex-shrink-0">
        <span className="font-semibold truncate text-xs sm:text-sm">{puzzle.meta.title}</span>
        <span
          className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
          style={{
            background: TIER_CONFIG[puzzle.meta.tier]?.bgColor ?? '#EAF3DE',
            color: TIER_CONFIG[puzzle.meta.tier]?.color ?? '#3B6D11',
          }}
        >
          {puzzle.meta.tier_label}
        </span>

        {/* Intel brief toggle */}
        <button
          onClick={() => setShowBrief((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors ml-0.5"
          title="Toggle intel brief"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Intel</span>
        </button>

        {/* Mode toggles — only shown while playing */}
        {phase === 'playing' && (
          <>
            {/* Multiple Choice toggle */}
            <button
              onClick={() => {
                setGameMode((m) => m === 'mc' ? 'standard' : 'mc')
                setMcSelected(null)
                setMcHovered(null)
                setMcWrongId(null)
              }}
              className={clsx(
                'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                gameMode === 'mc'
                  ? 'border-brand-teal/60 bg-brand-teal/20 text-brand-teal'
                  : 'border-white/20 text-white/40 hover:text-white/70 hover:border-white/40',
              )}
              title={gameMode === 'mc' ? 'Multiple Choice — 0.75× ATQ' : 'Enable Multiple Choice mode'}
            >
              <ListChecks className="w-3 h-3" />
              <span>MC</span>
            </button>

            {/* Challenge Mode toggle */}
            <button
              onClick={() => {
                setChallengeMode((v) => !v)
                setCurrentHint(null)
              }}
              className={clsx(
                'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                challengeMode
                  ? 'border-gate-amber/60 bg-gate-amber/20 text-gate-amber'
                  : 'border-white/20 text-white/40 hover:text-white/70 hover:border-white/40',
              )}
              title={challengeMode ? 'Challenge Mode — no hints, ×1.5 ATQ' : 'Enable Challenge Mode'}
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">Challenge</span>
            </button>
          </>
        )}
        {/* Static badges when not playing */}
        {phase !== 'playing' && challengeMode && (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-gate-amber/60 bg-gate-amber/20 text-gate-amber">
            <Zap className="w-3 h-3" />
            Challenge
          </span>
        )}
        {phase !== 'playing' && gameMode === 'mc' && (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-brand-teal/60 bg-brand-teal/20 text-brand-teal">
            <ListChecks className="w-3 h-3" />
            MC
          </span>
        )}

        <span className={clsx(
          'ml-auto font-mono text-sm tabular-nums',
          timerWarning ? 'text-target-red animate-pulse' : 'text-brand-teal',
        )}>
          {timerMins}:{String(timerSecs).padStart(2, '0')}
        </span>
      </div>

      {/* Intel brief — collapsible */}
      {showBrief && (
        <div className="flex-shrink-0 bg-brand-teallite border-b border-brand-teal/30 px-4 py-2.5 flex items-start gap-3">
          <span className="text-base flex-shrink-0">{DOMAIN_ICONS[puzzle.meta.domain] ?? '🔒'}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-brand-tealdk uppercase tracking-wider mb-0.5">
              Intel Brief — {puzzle.narrative.world}
            </p>
            <p className="text-xs text-slate leading-relaxed">{puzzle.narrative.intel_brief}</p>
          </div>
          <button onClick={() => setShowBrief(false)} className="flex-shrink-0 text-brand-tealdk/60 hover:text-brand-tealdk">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* ── Left panel: desktop always-visible sidebar ── */}
        <aside className="hidden sm:flex sm:flex-col w-52 flex-shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto p-3">
          <RuleSetPanel
            rules={puzzle.rules}
            highlightedGateId={puzzle.meta.tier >= 4 ? puzzle.rules[puzzle.rules.length - 1]?.gate_id : undefined}
          />
        </aside>

        {/* ── Mobile rules drawer overlay ── */}
        {showMobileRules && (
          <div className="sm:hidden absolute inset-0 z-30 flex">
            <div className="w-72 max-w-[85vw] bg-slate-50 border-r border-slate-200 overflow-y-auto flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-slate-200 flex-shrink-0">
                <span className="text-sm font-semibold text-brand-navy">Rule Set</span>
                <button
                  onClick={() => setShowMobileRules(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 overflow-y-auto">
                <RuleSetPanel
                  rules={puzzle.rules}
                  highlightedGateId={puzzle.meta.tier >= 4 ? puzzle.rules[puzzle.rules.length - 1]?.gate_id : undefined}
                />
              </div>
            </div>
            {/* Tap outside to close */}
            <div className="flex-1 bg-black/20" onClick={() => setShowMobileRules(false)} />
          </div>
        )}

        {/* ── Center — Node Graph ── */}
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
            fitViewOptions={{ padding: isMobile ? 0.15 : 0.3 }}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnDrag
            zoomOnPinch
            zoomOnScroll={!isMobile}
            minZoom={0.2}
            maxZoom={2.5}
            className="bg-white"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#cbd5e1" gap={24} size={1} />
            {!isMobile && <Controls showInteractive={false} />}
            {!isMobile && (
              <MiniMap
                nodeColor={(n) => {
                  const type = (n.data as unknown as BLNodeData).nodeType
                  const colors = COLORS.node as Record<string, { bg: string; border: string; text: string }>
                  return colors[type]?.border ?? COLORS.slate.mid
                }}
                maskColor="rgba(255,255,255,0.75)"
                style={{ border: '1px solid #e2e8f0' }}
              />
            )}
          </ReactFlow>

          {/* Mobile floating Rules button (top-left) */}
          <div className="sm:hidden absolute top-3 left-3 z-10">
            <button
              onClick={() => setShowMobileRules(true)}
              className="flex items-center gap-1.5 bg-brand-navy/90 text-white text-xs px-2.5 py-1.5 rounded-full shadow-md backdrop-blur-sm active:scale-95 transition-transform"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Rules
            </button>
          </div>

          {/* Hint bubble — sits above mobile bottom bar on small screens */}
          {currentHint && (
            <div className="absolute bottom-16 sm:bottom-4 left-4 right-4 bg-brand-teallite border border-brand-teal/40 rounded-lg px-4 py-2.5 text-xs text-slate shadow-sm animate-slide-up">
              <span className="font-semibold text-brand-tealdk">Hint: </span>
              {currentHint}
            </div>
          )}

          {/* Mobile bottom action bar */}
          <div className="sm:hidden absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 py-2 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              {placements.length}/{puzzle.tokens.count} tokens
            </span>
            {phase === 'playing' && gameMode !== 'mc' && placements.length > 0 && (
              <span className="text-[10px] text-brand-teal font-medium">
                · {puzzle.tokens.count - placements.length > 0
                  ? `${puzzle.tokens.count - placements.length} more`
                  : 'ready!'}
              </span>
            )}
            <div className="flex-1" />
            <button
              onClick={() => setShowMobileObjective(true)}
              className="flex items-center gap-1.5 bg-brand-navy text-white text-xs px-3 py-1.5 rounded-full shadow active:scale-95 transition-transform"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              {phase === 'breach-confirmed'
                ? 'Results'
                : gameMode === 'mc'
                ? 'Choices'
                : 'Objective'}
            </button>
          </div>
        </div>

        {/* ── Right panel: desktop always-visible sidebar ── */}
        <aside className={clsx(
          'hidden sm:block flex-shrink-0 border-l border-slate-200 overflow-y-auto transition-all duration-200',
          rightPanelWidth,
          phase === 'breach-confirmed' ? 'bg-white' : 'bg-slate-50 p-3',
        )}>
          {rightPanelContent}
        </aside>

        {/* ── Mobile objective bottom sheet ── */}
        {showMobileObjective && (
          <div className="sm:hidden absolute inset-0 z-30 flex flex-col justify-end">
            {/* Tap backdrop to close (only when not in breach-confirmed to avoid accidental dismiss) */}
            <div
              className="flex-1 bg-black/25"
              onClick={() => phase !== 'breach-confirmed' && setShowMobileObjective(false)}
            />
            <div className="bg-white rounded-t-2xl max-h-[78vh] flex flex-col shadow-2xl">
              {/* Sheet handle + header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-slate-100 flex-shrink-0">
                <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                <span className="text-sm font-semibold text-brand-navy">
                  {phase === 'breach-confirmed'
                    ? 'Breach Results'
                    : gameMode === 'mc'
                    ? 'Multiple Choice'
                    : 'Objective'}
                </span>
                <button
                  onClick={() => setShowMobileObjective(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Panel content */}
              <div className={clsx(
                'overflow-y-auto flex-1',
                phase === 'breach-confirmed' ? '' : 'p-3',
              )}>
                {rightPanelContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
