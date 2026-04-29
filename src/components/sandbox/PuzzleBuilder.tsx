'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  MarkerType, Handle, Position,
  type Node, type Edge, type Connection, type NodeTypes,
  type OnNodesChange, type OnEdgesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type {
  NodeType, NodePrivilege, EdgeType, SeamType,
  PuzzleRule, SolutionStep, HintStep, Puzzle, PuzzleTier, PuzzleDomain, TierLabel,
} from '@/types/puzzle'
import { COLORS, TIER_CONFIG, DOMAIN_ICONS, SEAM_TYPE_LABELS } from '@/constants/theme'
import { createClient } from '@/lib/supabase/client'
import PuzzleCanvas from '@/components/puzzle/PuzzleCanvas'
import clsx from 'clsx'
import {
  Plus, Trash2, Download, Save, Eye, Settings, List, ChevronRight,
  Check, AlertCircle, Loader2, Sparkles, X, Globe,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BuilderNodeData extends Record<string, unknown> {
  label: string
  sublabel: string
  nodeType: NodeType
  privilege: NodePrivilege
  locked: boolean
  tokenSlot: boolean
}

interface BuilderEdgeData extends Record<string, unknown> {
  edgeType: EdgeType
  blockedBy?: string
}

// ── Custom Builder Node ───────────────────────────────────────────────────────

function BuilderNode({ id, data, selected }: { id: string; data: BuilderNodeData; selected?: boolean }) {
  const colorMap = COLORS.node as Record<string, { bg: string; border: string; text: string }>
  const colors = colorMap[data.nodeType] ?? colorMap.process

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 10, height: 10, background: '#00BCD4', border: '2px solid white' }}
      />
      <div
        className={clsx(
          'rounded-[6px] border-2 px-3 py-2 text-center min-w-[100px] max-w-[140px] transition-all select-none',
          selected && 'shadow-lg',
        )}
        style={{
          background: colors.bg,
          borderColor: selected ? '#00BCD4' : colors.border,
          boxShadow: selected ? '0 0 0 2px #00BCD4' : undefined,
        }}
      >
        {selected && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-teal flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        <p className="text-[11px] font-semibold leading-tight" style={{ color: colors.border }}>
          {data.label || '(unnamed)'}
        </p>
        {data.sublabel && (
          <p className="text-[9px] mt-0.5 leading-tight" style={{ color: colors.text }}>
            {data.sublabel}
          </p>
        )}
        <p className="text-[8px] mt-0.5 opacity-40 uppercase tracking-wider" style={{ color: colors.text }}>
          {data.nodeType}
        </p>
        {data.locked && <p className="text-[8px] text-target-red mt-0.5">🔒 locked</p>}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 10, height: 10, background: '#00BCD4', border: '2px solid white' }}
      />
    </>
  )
}

const NODE_TYPES: NodeTypes = { 'builder-node': BuilderNode as never }

// ── Edge style helper ─────────────────────────────────────────────────────────

function edgeStyle(type: EdgeType): Partial<Edge> {
  if (type === 'bypass') return {
    // Dashed orange — circumvents a gate
    style: { stroke: '#E65100', strokeWidth: 2.5, strokeDasharray: '8 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#E65100' },
    animated: true,
  }
  if (type === 'trigger') return {
    // Solid purple — activates a side-effect
    style: { stroke: '#7B1FA2', strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#7B1FA2' },
    animated: true,
  }
  if (type === 'condition') return {
    style: { stroke: '#BA7517', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#BA7517' },
    animated: false,
  }
  return {
    style: { stroke: '#475569', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
    animated: false,
  }
}

// ── Main PuzzleBuilder ────────────────────────────────────────────────────────

type Tab = 'build' | 'rules' | 'configure' | 'preview'

const NODE_PALETTE: { type: NodeType; label: string; desc: string }[] = [
  { type: 'actor',   label: 'Actor',   desc: 'User, role, or account' },
  { type: 'gate',    label: 'Gate',    desc: 'Policy check / condition' },
  { type: 'process', label: 'Process', desc: 'Service or mechanism' },
  { type: 'system',  label: 'System',  desc: 'System-level execution' },
  { type: 'target',  label: 'Target',  desc: 'Sensitive resource' },
]

const PRIVILEGE_OPTIONS: NodePrivilege[] = ['user', 'admin', 'system', 'none']
const EDGE_TYPE_OPTIONS: EdgeType[] = ['flow', 'condition', 'trigger', 'bypass']
const SEAM_TYPES: SeamType[] = [
  'missing-clause', 'policy-contradiction', 'delegation-chain',
  'scope-confusion', 'race-condition', 'ai-logic-chain',
]
const DOMAINS: PuzzleDomain[] = [
  'Cloud IAM', 'AI Agents', 'Financial Controls', 'Supply Chain',
  'Incident Response', 'Compliance GRC', 'Network', 'Identity',
]

export default function PuzzleBuilder({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>('build')

  // Graph state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BuilderNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<BuilderEdgeData>>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const nodeCounter = useRef(0)

  // Meta
  const [title, setTitle] = useState('My Puzzle')
  const [tier, setTier] = useState<PuzzleTier>(1)
  const [domain, setDomain] = useState<PuzzleDomain>('Cloud IAM')
  const [estimatedMinutes, setEstimatedMinutes] = useState(5)
  const [world, setWorld] = useState('')
  const [scenario, setScenario] = useState('')
  const [intelBrief, setIntelBrief] = useState('')

  // Rules
  const [rules, setRules] = useState<PuzzleRule[]>([])

  // Tokens
  const [tokenCount, setTokenCount] = useState(1)
  const [tokenLabels, setTokenLabels] = useState(['Token A'])

  // Objective
  const [objectiveDesc, setObjectiveDesc] = useState('')
  const [targetNodeId, setTargetNodeId] = useState('')
  const [unauthorizedOutcome, setUnauthorizedOutcome] = useState('')

  // Solution
  const [seamType, setSeamType] = useState<SeamType>('missing-clause')
  const [seamDescription, setSeamDescription] = useState('')
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([])

  // Pedagogy
  const [ahaMoment, setAhaMoment] = useState('')
  const [hints, setHints] = useState<HintStep[]>([
    { level: 1, prompt: '' },
    { level: 2, prompt: '' },
    { level: 3, prompt: '' },
  ])

  // Save / Publish
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)       // Supabase row UUID
  const [savedPuzzleId, setSavedPuzzleId] = useState<string | null>(null) // puzzle data.id
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // AI generation
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAIPrompt] = useState('')
  const [aiDomain, setAIDomain] = useState<PuzzleDomain>('Cloud IAM')
  const [aiTier, setAITier] = useState<PuzzleTier>(2)
  const [aiGenerating, setAIGenerating] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)

  // ── Graph helpers ───────────────────────────────────────────────────────────

  function addNode(type: NodeType) {
    const id = `n-${++nodeCounter.current}`
    const x = 150 + (nodeCounter.current % 5) * 170
    const y = 120 + Math.floor((nodeCounter.current - 1) / 5) * 120
    const newNode: Node<BuilderNodeData> = {
      id,
      type: 'builder-node',
      position: { x, y },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        sublabel: '',
        nodeType: type,
        privilege: type === 'target' ? 'none' : type === 'gate' ? 'none' : 'user',
        locked: type === 'target',
        tokenSlot: type !== 'gate' && type !== 'target',
      },
      selected: false,
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeId(id)
    setSelectedEdgeId(null)
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId))
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId))
    setSelectedNodeId(null)
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId))
    setSelectedEdgeId(null)
  }

  function updateNodeData(nodeId: string, updates: Partial<BuilderNodeData>) {
    setNodes((nds) =>
      nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n)
    )
  }

  function updateEdgeData(edgeId: string, updates: Partial<BuilderEdgeData> & { label?: string }) {
    setEdges((eds) =>
      eds.map((e): Edge<BuilderEdgeData> => {
        if (e.id !== edgeId) return e
        const newEdgeType = (updates.edgeType ?? e.data?.edgeType ?? 'flow') as EdgeType
        const s = edgeStyle(newEdgeType)
        return {
          ...e,
          label: updates.label !== undefined ? updates.label : e.label,
          data: { ...(e.data ?? {}), ...updates } as BuilderEdgeData,
          style: s.style,
          markerEnd: s.markerEnd,
          animated: s.animated ?? false,
        }
      })
    )
  }

  const onConnect = useCallback(
    (conn: Connection) => {
      const style = edgeStyle('flow')
      setEdges((eds) => addEdge({
        ...conn,
        id: `e-${conn.source}-${conn.target}-${Date.now()}`,
        type: 'smoothstep',
        data: { edgeType: 'flow' as EdgeType } as BuilderEdgeData,
        style: style.style,
        markerEnd: style.markerEnd,
        animated: style.animated ?? false,
        label: '',
        labelStyle: { fontSize: 9, fill: '#475569' },
        labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
      } as Edge<BuilderEdgeData>, eds))
    },
    [setEdges],
  )

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }, [])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [])

  // ── Token label sync ────────────────────────────────────────────────────────

  function setTokenCountSynced(n: number) {
    setTokenCount(n)
    setTokenLabels((prev) => {
      const next = [...prev]
      while (next.length < n) next.push(`Token ${String.fromCharCode(65 + next.length)}`)
      return next.slice(0, n)
    })
  }

  // ── Solution steps ──────────────────────────────────────────────────────────

  function addSolutionStep() {
    setSolutionSteps((prev) => [
      ...prev,
      { step: prev.length + 1, node_id: '', action: '', mechanism: '' },
    ])
  }

  function updateSolutionStep(i: number, updates: Partial<SolutionStep>) {
    setSolutionSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, ...updates } : s))
  }

  function deleteSolutionStep(i: number) {
    setSolutionSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 })))
  }

  // ── Rules ───────────────────────────────────────────────────────────────────

  function addRule() {
    setRules((prev) => [
      ...prev,
      { id: `R-${String(prev.length + 1).padStart(2, '0')}`, gate_id: '', label: '', condition: '', effect: '' },
    ])
  }

  function updateRule(i: number, updates: Partial<PuzzleRule>) {
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, ...updates } : r))
  }

  function deleteRule(i: number) {
    setRules((prev) =>
      prev.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, id: `R-${String(idx + 1).padStart(2, '0')}` }))
    )
  }

  // ── AI generation ───────────────────────────────────────────────────────────

  function populatePuzzle(puzzle: Puzzle) {
    // Meta
    setTitle(puzzle.meta.title)
    setTier(puzzle.meta.tier)
    setDomain(puzzle.meta.domain)
    setEstimatedMinutes(puzzle.meta.estimated_minutes)
    setWorld(puzzle.narrative.world ?? '')
    setScenario(puzzle.narrative.scenario)
    setIntelBrief(puzzle.narrative.intel_brief)

    // Rules
    setRules(puzzle.rules)

    // Tokens
    setTokenCount(puzzle.tokens.count)
    setTokenLabels(puzzle.tokens.labels)

    // Objective
    setObjectiveDesc(puzzle.objective.description)
    setTargetNodeId(puzzle.objective.target_node)
    setUnauthorizedOutcome(puzzle.objective.unauthorized_outcome)

    // Solution
    setSeamType(puzzle.solution.seam_type)
    setSeamDescription(puzzle.solution.seam_description)
    setSolutionSteps(puzzle.solution.steps)

    // Pedagogy
    setAhaMoment(puzzle.pedagogy.aha_moment)
    setHints(
      puzzle.pedagogy.hint_sequence.length >= 3
        ? puzzle.pedagogy.hint_sequence.slice(0, 3)
        : [
            ...puzzle.pedagogy.hint_sequence,
            ...Array.from({ length: 3 - puzzle.pedagogy.hint_sequence.length }, (_, i) => ({
              level: puzzle.pedagogy.hint_sequence.length + i + 1,
              prompt: '',
            })),
          ],
    )

    // Nodes → ReactFlow nodes
    nodeCounter.current = puzzle.map.nodes.length
    const rfNodes: Node<BuilderNodeData>[] = puzzle.map.nodes.map((n) => ({
      id: n.id,
      type: 'builder-node',
      position: n.position,
      selected: false,
      data: {
        label: n.label,
        sublabel: n.sublabel ?? '',
        nodeType: n.type,
        privilege: n.privilege ?? 'user',
        locked: n.locked ?? false,
        tokenSlot: n.token_slot !== false,
      },
    }))
    setNodes(rfNodes)

    // Edges → ReactFlow edges
    const rfEdges: Edge<BuilderEdgeData>[] = puzzle.map.edges.map((e, i) => {
      const eType = (e.type ?? 'flow') as EdgeType
      const s = edgeStyle(eType)
      return {
        id: `e-${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        type: 'smoothstep',
        label: e.label ?? '',
        labelStyle: { fontSize: 9, fill: '#475569' },
        labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        data: { edgeType: eType, blockedBy: e.blocked_by } as BuilderEdgeData,
        style: s.style,
        markerEnd: s.markerEnd,
        animated: s.animated ?? false,
      }
    })
    setEdges(rfEdges)

    setSavedId(null)
    setSavedPuzzleId(puzzle.id)
    setPublished(false)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) return
    setAIGenerating(true)
    setAIError(null)
    try {
      const res = await fetch('/api/generate-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt, domain: aiDomain, tier: aiTier }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setAIError(json.error ?? 'Generation failed')
        return
      }
      populatePuzzle(json.puzzle as Puzzle)
      setShowAIModal(false)
      setAIPrompt('')
      setTab('build')
    } catch {
      setAIError('Network error — check your connection')
    } finally {
      setAIGenerating(false)
    }
  }

  // ── Load from admin handoff (sessionStorage) ───────────────────────────────

  useEffect(() => {
    const raw = sessionStorage.getItem('bl_builder_load')
    if (!raw) return
    sessionStorage.removeItem('bl_builder_load')
    try {
      const handoff = JSON.parse(raw) as {
        puzzle: unknown
        rowId: string | null
        puzzleDataId: string
      }
      if (handoff.puzzle) {
        populatePuzzle(handoff.puzzle as Puzzle)
        if (handoff.rowId) {
          setSavedId(handoff.rowId)
          setPublished(true)   // existing row — already live
        }
        if (handoff.puzzleDataId) setSavedPuzzleId(handoff.puzzleDataId)
      }
    } catch {
      // malformed handoff — ignore
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build Puzzle object ─────────────────────────────────────────────────────

  function buildPuzzle(): Puzzle {
    const mapNodes = nodes.map((n) => ({
      id: n.id,
      label: n.data.label || n.id,
      sublabel: n.data.sublabel || undefined,
      type: n.data.nodeType,
      position: n.position,
      privilege: n.data.privilege,
      locked: n.data.locked,
      token_slot: n.data.tokenSlot,
    }))

    const mapEdges = edges.map((e) => ({
      from: e.source,
      to: e.target,
      label: typeof e.label === 'string' && e.label ? e.label : undefined,
      type: e.data?.edgeType ?? 'flow',
      blocked_by: e.data?.blockedBy || undefined,
    }))

    return {
      id: savedPuzzleId ?? `BL-CUSTOM-${Date.now()}`,
      version: '1',
      meta: {
        title: title || 'Untitled Puzzle',
        tier,
        tier_label: TIER_CONFIG[tier].label as TierLabel,
        domain,
        season: 1,
        estimated_minutes: estimatedMinutes,
        author: 'Community',
        status: 'draft',
      },
      narrative: { world, scenario, intel_brief: intelBrief },
      map: { nodes: mapNodes, edges: mapEdges },
      rules,
      tokens: { count: tokenCount, labels: tokenLabels },
      objective: {
        description: objectiveDesc,
        target_node: targetNodeId,
        unauthorized_outcome: unauthorizedOutcome,
      },
      solution: {
        steps: solutionSteps,
        seam_type: seamType,
        seam_description: seamDescription,
      },
      pedagogy: {
        aha_moment: ahaMoment,
        ctem_principle: '',
        hint_sequence: hints.filter((h) => h.prompt.trim()),
      },
    }
  }

  // ── Save / Export ───────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const supabase = createClient()
      const puzzle = buildPuzzle()
      const row = { author_id: userId, title: puzzle.meta.title, data: puzzle as unknown }

      if (savedId) {
        const { error } = await supabase
          .from('community_puzzles')
          .update({ ...row, updated_at: new Date().toISOString() })
          .eq('id', savedId)
        if (error) throw error
        setSaveMsg('Saved!')
      } else {
        const { data, error } = await supabase
          .from('community_puzzles')
          .insert(row)
          .select('id')
          .single()
        if (error) throw error
        setSavedId(data.id)
        setSavedPuzzleId(puzzle.id)
        setSaveMsg('Saved!')
      }
    } catch {
      setSaveMsg('Save failed — check Supabase community_puzzles table exists')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 4000)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setSaveMsg(null)
    try {
      const supabase = createClient()
      const puzzle = buildPuzzle()
      const row = { author_id: userId, title: puzzle.meta.title, data: puzzle as unknown, published: true }

      if (savedId) {
        const { error } = await supabase
          .from('community_puzzles')
          .update({ ...row, updated_at: new Date().toISOString() })
          .eq('id', savedId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('community_puzzles')
          .insert(row)
          .select('id')
          .single()
        if (error) throw error
        setSavedId(data.id)
        setSavedPuzzleId(puzzle.id)
      }
      setPublished(true)
      setSaveMsg(`Published! /puzzle/${puzzle.id}`)
    } catch {
      setSaveMsg('Publish failed — check Supabase community_puzzles table exists')
    } finally {
      setPublishing(false)
      setTimeout(() => setSaveMsg(null), 6000)
    }
  }

  function handleExport() {
    const puzzle = buildPuzzle()
    const blob = new Blob([JSON.stringify(puzzle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${puzzle.meta.title.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Derived selection ───────────────────────────────────────────────────────

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar + actions */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0">
        {([ ['build', 'Build Graph', null], ['rules', 'Rules', null], ['configure', 'Configure', null], ['preview', 'Preview', null] ] as [Tab, string, null][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              tab === t ? 'bg-brand-navy text-white' : 'text-slate hover:text-brand-navy hover:bg-slate-100',
            )}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {saveMsg && (
            <span className={clsx(
              'text-xs font-medium',
              saveMsg.startsWith('Save failed') || saveMsg.startsWith('Publish failed')
                ? 'text-target-red'
                : 'text-success-green',
            )}>
              {saveMsg.startsWith('Published!') ? '✓ Published to library' : saveMsg}
            </span>
          )}
          {/* Generate with AI */}
          <button
            onClick={() => { setShowAIModal(true); setAIError(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-teal text-white rounded-md hover:bg-brand-tealdk transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate with AI
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handleSave}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>
          {published ? (
            <button
              onClick={handlePublish}
              disabled={saving || publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-success-green bg-success-greenlite border border-success-green/30 rounded-md hover:bg-success-green/20 transition-colors disabled:opacity-60"
              title="Re-publish to update the live puzzle"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Update Live Puzzle
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={saving || publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-navy text-white rounded-md hover:bg-brand-navydk transition-colors disabled:opacity-60"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Publish to Library
            </button>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-semibold text-brand-navy">Generate Puzzle with AI</h2>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-slate-mid hover:text-slate transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider block mb-1.5">
                  Describe your puzzle concept
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                  placeholder="e.g. A contractor who can approve their own invoices by exploiting a delegation gap in the finance approval chain"
                  rows={4}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-teal/40 leading-relaxed"
                  autoFocus
                />
                <p className="text-[10px] text-slate-mid mt-1">
                  Be specific: describe the actor, the policy gap, and the target resource.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider block mb-1.5">
                    Domain
                  </label>
                  <select
                    value={aiDomain}
                    onChange={(e) => setAIDomain(e.target.value as PuzzleDomain)}
                    className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal bg-white"
                  >
                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider block mb-1.5">
                    Difficulty tier
                  </label>
                  <select
                    value={aiTier}
                    onChange={(e) => setAITier(Number(e.target.value) as PuzzleTier)}
                    className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal bg-white"
                  >
                    {([1, 2, 3, 4, 5] as PuzzleTier[]).map((t) => (
                      <option key={t} value={t}>T{t} · {TIER_CONFIG[t].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="rounded-lg bg-target-redlite border border-target-red/30 px-3 py-2">
                  <p className="text-xs text-target-reddk">{aiError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setShowAIModal(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-mid hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateWithAI}
                disabled={!aiPrompt.trim() || aiGenerating}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                  aiPrompt.trim() && !aiGenerating
                    ? 'bg-brand-teal text-white hover:bg-brand-tealdk'
                    : 'bg-slate-200 text-slate-mid cursor-not-allowed',
                )}
              >
                {aiGenerating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Generate Puzzle</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* ── BUILD TAB ────────────────────────────────────────────────── */}
        {tab === 'build' && (
          <div className="flex h-full min-h-0">
            {/* Left: node palette */}
            <aside className="w-44 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-3 overflow-y-auto flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-2">Add node</p>
                <div className="space-y-1.5">
                  {NODE_PALETTE.map(({ type, label, desc }) => {
                    const colors = (COLORS.node as Record<string, { bg: string; border: string; text: string }>)[type]
                    return (
                      <button
                        key={type}
                        onClick={() => addNode(type)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all hover:shadow-sm"
                        style={{ background: colors.bg, borderColor: colors.border + '60' }}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors.border }} />
                        <div>
                          <p className="text-[11px] font-semibold" style={{ color: colors.border }}>{label}</p>
                          <p className="text-[9px] leading-tight" style={{ color: colors.text }}>{desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid mb-2">Edge types</p>
                <div className="space-y-2 text-[10px] text-slate">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#475569" strokeWidth="2"/></svg>
                    <span>flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#BA7517" strokeWidth="2"/></svg>
                    <span>condition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#E65100" strokeWidth="2.5" strokeDasharray="6 3"/></svg>
                    <span className="text-orange-700">bypass</span>
                    <span className="text-slate-mid">– dashed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#7B1FA2" strokeWidth="2.5"/></svg>
                    <span className="text-purple-700">trigger</span>
                    <span className="text-slate-mid">– purple</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-mid mt-2 leading-relaxed">Draw edges by dragging from the blue handles on nodes.</p>
              </div>

              {(selectedNodeId || selectedEdgeId) && (
                <div className="mt-auto pt-3 border-t border-slate-200">
                  <button
                    onClick={selectedNodeId ? deleteSelectedNode : deleteSelectedEdge}
                    className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-target-red border border-target-red/30 rounded-lg hover:bg-target-redlite transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete {selectedNodeId ? 'node' : 'edge'}
                  </button>
                </div>
              )}
            </aside>

            {/* Center: React Flow canvas */}
            <div className="flex-1 min-w-0 relative">
              <ReactFlow
                nodes={nodes as Node[]}
                edges={edges as Edge[]}
                nodeTypes={NODE_TYPES}
                onNodesChange={onNodesChange as OnNodesChange<Node>}
                onEdgesChange={onEdgesChange as OnEdgesChange<Edge>}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onPaneClick={handlePaneClick}
                nodesDraggable
                nodesConnectable
                fitView
                fitViewOptions={{ padding: 0.3 }}
                className="bg-white"
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#cbd5e1" gap={24} size={1} />
                <Controls showInteractive={false} />
                <MiniMap maskColor="rgba(255,255,255,0.75)" style={{ border: '1px solid #e2e8f0' }} />
              </ReactFlow>
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-slate-mid">
                    <p className="text-sm font-medium">Canvas is empty</p>
                    <p className="text-xs mt-1">Click a node type in the left panel to add it</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Properties panel */}
            <aside className="w-56 flex-shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto p-3">
              {selectedNode ? (
                <NodePropertiesPanel
                  node={selectedNode}
                  onChange={(updates) => updateNodeData(selectedNode.id, updates)}
                />
              ) : selectedEdge ? (
                <EdgePropertiesPanel
                  edge={selectedEdge}
                  nodeOptions={nodes.map((n) => ({ id: n.id, label: n.data.label || n.id }))}
                  onChange={(updates) => updateEdgeData(selectedEdge.id, updates)}
                />
              ) : (
                <div className="text-xs text-slate-mid text-center pt-8">
                  <Settings className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p>Click a node or edge to edit its properties</p>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* ── RULES TAB ────────────────────────────────────────────────── */}
        {tab === 'rules' && (
          <div className="h-full overflow-y-auto p-5">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-brand-navy">Policy Rules</h2>
                  <p className="text-xs text-slate-mid mt-0.5">Define the IF/THEN rules that govern this system.</p>
                </div>
                <button
                  onClick={addRule}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-brand-navydk transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Rule
                </button>
              </div>

              {rules.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-mid">
                  <List className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No rules yet. Add your first IF/THEN policy rule.</p>
                </div>
              )}

              {rules.map((rule, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-slate-lite text-slate px-2 py-0.5 rounded">{rule.id}</span>
                    <input
                      value={rule.label}
                      onChange={(e) => updateRule(i, { label: e.target.value })}
                      placeholder="Rule label (e.g. Manager Gate)"
                      className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                    />
                    <button onClick={() => deleteRule(i)} className="text-slate-mid hover:text-target-red transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider block mb-1">
                        Gate Node ID
                      </label>
                      <select
                        value={rule.gate_id}
                        onChange={(e) => updateRule(i, { gate_id: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal bg-white"
                      >
                        <option value="">— select node —</option>
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>{n.data.label || n.id}</option>
                        ))}
                      </select>
                    </div>
                    <div />
                    <div>
                      <label className="text-[10px] font-semibold text-brand-tealdk uppercase tracking-wider block mb-1">
                        IF (condition)
                      </label>
                      <textarea
                        value={rule.condition}
                        onChange={(e) => updateRule(i, { condition: e.target.value })}
                        placeholder="e.g. payment > $500 AND MGR_ID is present"
                        rows={2}
                        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand-teal"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-target-red uppercase tracking-wider block mb-1">
                        THEN (effect)
                      </label>
                      <textarea
                        value={rule.effect}
                        onChange={(e) => updateRule(i, { effect: e.target.value })}
                        placeholder="e.g. pass MGR_ID to the validator"
                        rows={2}
                        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand-teal"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONFIGURE TAB ────────────────────────────────────────────── */}
        {tab === 'configure' && (
          <div className="h-full overflow-y-auto p-5">
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Metadata */}
              <Section title="Puzzle Metadata">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <FieldLabel>Title</FieldLabel>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Ghost Approver"
                      className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel>Tier</FieldLabel>
                    <select value={tier} onChange={(e) => setTier(Number(e.target.value) as PuzzleTier)} className={selectCls}>
                      {([1, 2, 3, 4, 5] as PuzzleTier[]).map((t) => (
                        <option key={t} value={t}>T{t} · {TIER_CONFIG[t].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Domain</FieldLabel>
                    <select value={domain} onChange={(e) => setDomain(e.target.value as PuzzleDomain)} className={selectCls}>
                      {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN_ICONS[d]} {d}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Estimated minutes</FieldLabel>
                    <input type="number" min={1} max={30} value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel>World / Company name</FieldLabel>
                    <input value={world} onChange={(e) => setWorld(e.target.value)} placeholder="e.g. Apex Retail Corp" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>Scenario (shown to player)</FieldLabel>
                    <textarea value={scenario} onChange={(e) => setScenario(e.target.value)} rows={3}
                      placeholder="Describe the situation and what the player must do…" className={textareaCls} />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>Intel Brief (optional background lore)</FieldLabel>
                    <textarea value={intelBrief} onChange={(e) => setIntelBrief(e.target.value)} rows={2}
                      placeholder="Background context shown when player clicks the Intel button…" className={textareaCls} />
                  </div>
                </div>
              </Section>

              {/* Tokens */}
              <Section title="Action Tokens">
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Token count</FieldLabel>
                    <input type="number" min={1} max={5} value={tokenCount}
                      onChange={(e) => setTokenCountSynced(Number(e.target.value))} className={clsx(inputCls, 'w-24')} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {tokenLabels.map((lbl, i) => (
                      <div key={i}>
                        <FieldLabel>Token {String.fromCharCode(65 + i)}</FieldLabel>
                        <input
                          value={lbl}
                          onChange={(e) => setTokenLabels((prev) => prev.map((l, j) => j === i ? e.target.value : l))}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Objective */}
              <Section title="Objective">
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Description (shown in right panel)</FieldLabel>
                    <textarea value={objectiveDesc} onChange={(e) => setObjectiveDesc(e.target.value)} rows={2}
                      placeholder="What must the player accomplish?" className={textareaCls} />
                  </div>
                  <div>
                    <FieldLabel>Target node</FieldLabel>
                    <select value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} className={selectCls}>
                      <option value="">— select target node —</option>
                      {nodes.filter((n) => n.data.nodeType === 'target').map((n) => (
                        <option key={n.id} value={n.id}>{n.data.label || n.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Unauthorized outcome (describe the breach)</FieldLabel>
                    <textarea value={unauthorizedOutcome} onChange={(e) => setUnauthorizedOutcome(e.target.value)} rows={2}
                      placeholder="e.g. A $750 payment approved with no manager oversight" className={textareaCls} />
                  </div>
                </div>
              </Section>

              {/* Solution */}
              <Section title="Solution">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Seam type</FieldLabel>
                      <select value={seamType} onChange={(e) => setSeamType(e.target.value as SeamType)} className={selectCls}>
                        {SEAM_TYPES.map((s) => <option key={s} value={s}>{SEAM_TYPE_LABELS[s]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Seam description</FieldLabel>
                    <textarea value={seamDescription} onChange={(e) => setSeamDescription(e.target.value)} rows={2}
                      placeholder="Explain the logical gap in 1–2 sentences" className={textareaCls} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel>Solution steps</FieldLabel>
                      <button onClick={addSolutionStep}
                        className="text-xs text-brand-teal hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add step
                      </button>
                    </div>
                    {solutionSteps.map((step, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {step.step}
                          </span>
                          <select
                            value={step.node_id}
                            onChange={(e) => updateSolutionStep(i, { node_id: e.target.value })}
                            className={clsx(selectCls, 'flex-1')}
                          >
                            <option value="">— node —</option>
                            {nodes.map((n) => <option key={n.id} value={n.id}>{n.data.label || n.id}</option>)}
                          </select>
                          <button onClick={() => deleteSolutionStep(i)} className="text-slate-mid hover:text-target-red">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <input value={step.action} onChange={(e) => updateSolutionStep(i, { action: e.target.value })}
                          placeholder="Action taken at this node" className={inputCls} />
                        <textarea value={step.mechanism} onChange={(e) => updateSolutionStep(i, { mechanism: e.target.value })}
                          placeholder="How/why this works (shown in solve overlay)" rows={2} className={textareaCls} />
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Pedagogy */}
              <Section title="Pedagogy">
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Aha moment (key insight after solving)</FieldLabel>
                    <textarea value={ahaMoment} onChange={(e) => setAhaMoment(e.target.value)} rows={2}
                      placeholder="The lesson this puzzle teaches…" className={textareaCls} />
                  </div>
                  {hints.map((hint, i) => (
                    <div key={i}>
                      <FieldLabel>Hint {i + 1}</FieldLabel>
                      <input
                        value={hint.prompt}
                        onChange={(e) => setHints((prev) => prev.map((h, j) => j === i ? { ...h, prompt: e.target.value } : h))}
                        placeholder={`Level ${i + 1} hint — ${i === 0 ? 'broad nudge' : i === 1 ? 'more specific' : 'near-explicit'}`}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* ── PREVIEW TAB ──────────────────────────────────────────────── */}
        {tab === 'preview' && (
          <div className="h-full min-h-0 flex flex-col">
            {nodes.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-mid">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No nodes yet</p>
                  <p className="text-xs mt-1">Add nodes in the Build tab first</p>
                  <button onClick={() => setTab('build')} className="mt-3 flex items-center gap-1 text-xs text-brand-teal hover:underline mx-auto">
                    Go to Build <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <PuzzleCanvas puzzle={buildPuzzle()} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function NodePropertiesPanel({
  node,
  onChange,
}: {
  node: Node<BuilderNodeData>
  onChange: (u: Partial<BuilderNodeData>) => void
}) {
  const d = node.data
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid">Node properties</p>
      <p className="text-[10px] font-mono text-slate-mid">{node.id}</p>

      <div>
        <FieldLabel>Label</FieldLabel>
        <input value={d.label} onChange={(e) => onChange({ label: e.target.value })} className={inputCls} />
      </div>
      <div>
        <FieldLabel>Sublabel</FieldLabel>
        <input value={d.sublabel} onChange={(e) => onChange({ sublabel: e.target.value })}
          placeholder="optional" className={inputCls} />
      </div>
      <div>
        <FieldLabel>Type</FieldLabel>
        <select value={d.nodeType} onChange={(e) => onChange({ nodeType: e.target.value as NodeType })} className={selectCls}>
          {NODE_PALETTE.map(({ type, label }) => <option key={type} value={type}>{label}</option>)}
        </select>
      </div>
      <div>
        <FieldLabel>Privilege</FieldLabel>
        <select value={d.privilege} onChange={(e) => onChange({ privilege: e.target.value as NodePrivilege })} className={selectCls}>
          {PRIVILEGE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-slate cursor-pointer">
          <input type="checkbox" checked={d.tokenSlot} onChange={(e) => onChange({ tokenSlot: e.target.checked })}
            className="rounded" />
          Token slot
        </label>
        <label className="flex items-center gap-2 text-xs text-slate cursor-pointer">
          <input type="checkbox" checked={d.locked} onChange={(e) => onChange({ locked: e.target.checked })}
            className="rounded" />
          Locked
        </label>
      </div>
    </div>
  )
}

function EdgePropertiesPanel({
  edge,
  nodeOptions,
  onChange,
}: {
  edge: Edge<BuilderEdgeData>
  nodeOptions: { id: string; label: string }[]
  onChange: (u: Partial<BuilderEdgeData> & { label?: string }) => void
}) {
  const d = edge.data as BuilderEdgeData | undefined
  const edgeType = d?.edgeType ?? 'flow'
  const label = typeof edge.label === 'string' ? edge.label : ''
  const blockedBy = d?.blockedBy ?? ''

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-mid">Edge properties</p>
      <p className="text-[10px] font-mono text-slate-mid truncate">{edge.source} → {edge.target}</p>

      <div>
        <FieldLabel>Edge type</FieldLabel>
        <select value={edgeType} onChange={(e) => onChange({ edgeType: e.target.value as EdgeType })} className={selectCls}>
          {EDGE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <FieldLabel>Label</FieldLabel>
        <input value={label} onChange={(e) => onChange({ label: e.target.value })}
          placeholder="optional" className={inputCls} />
      </div>
      <div>
        <FieldLabel>Blocked by (node ID)</FieldLabel>
        <select value={blockedBy} onChange={(e) => onChange({ blockedBy: e.target.value || undefined })} className={selectCls}>
          <option value="">— none —</option>
          {nodeOptions.map(({ id, label: lbl }) => <option key={id} value={id}>{lbl}</option>)}
        </select>
        <p className="text-[10px] text-slate-mid mt-1 leading-relaxed">
          Set this on blocked flow edges. The engine will look for a bypass/trigger that reaches the same target.
        </p>
      </div>
    </div>
  )
}

// ── Shared mini-components ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-xs font-semibold text-brand-navy uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-semibold text-slate-mid uppercase tracking-wider block mb-1">{children}</label>
}

const inputCls = 'w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal bg-white'
const selectCls = 'w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal bg-white'
const textareaCls = 'w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand-teal bg-white'
