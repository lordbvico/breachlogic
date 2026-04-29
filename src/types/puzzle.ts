// BreachLogic Puzzle Type Definitions
// Auto-derived from puzzle_schema.json v1

export type PuzzleTier = 1 | 2 | 3 | 4 | 5
export type TierLabel = 'Scout' | 'Analyst' | 'Auditor' | 'Red-Teamer' | 'Grandmaster'
export type PuzzleDomain =
  | 'Cloud IAM'
  | 'AI Agents'
  | 'Financial Controls'
  | 'Supply Chain'
  | 'Incident Response'
  | 'Compliance GRC'
  | 'Network'
  | 'Identity'
  | 'Everyday Security'

export type PuzzleStatus = 'draft' | 'review' | 'approved' | 'published' | 'retired'
export type NodeType = 'actor' | 'gate' | 'process' | 'target' | 'system'
export type NodePrivilege = 'user' | 'system' | 'admin' | 'none'
export type EdgeType = 'flow' | 'condition' | 'trigger' | 'bypass'
export type SeamType =
  | 'missing-clause'
  | 'policy-contradiction'
  | 'privilege-escalation'
  | 'race-condition'
  | 'ai-logic-chain'
  | 'scope-confusion'
  | 'delegation-chain'
  | 'social-engineering'

// ── Node / Edge ──────────────────────────────────────────────────────────────

export interface PuzzleNodePosition {
  x: number
  y: number
}

export interface PuzzleNode {
  id: string
  label: string
  sublabel?: string
  type: NodeType
  position: PuzzleNodePosition
  locked?: boolean
  token_slot?: boolean
  privilege?: NodePrivilege
}

export interface PuzzleEdge {
  from: string
  to: string
  label?: string
  type?: EdgeType
  blocked_by?: string
}

export interface PuzzleMap {
  nodes: PuzzleNode[]
  edges: PuzzleEdge[]
}

// ── Rules ────────────────────────────────────────────────────────────────────

export interface PuzzleRule {
  id: string
  gate_id: string
  label: string
  condition: string
  effect: string
  seam_hint?: string  // internal only
}

// ── Tokens ───────────────────────────────────────────────────────────────────

export interface PuzzleTokens {
  count: number
  labels: string[]
}

// ── Objective ────────────────────────────────────────────────────────────────

export interface PuzzleObjective {
  description: string
  target_node: string
  unauthorized_outcome: string
}

// ── Solution ─────────────────────────────────────────────────────────────────

export interface SolutionStep {
  step: number
  node_id: string
  action: string
  mechanism: string
}

export interface PuzzleSolution {
  steps: SolutionStep[]
  seam_type: SeamType
  seam_description: string
  alternate_paths?: string[]
}

// ── Pedagogy ─────────────────────────────────────────────────────────────────

export interface HintStep {
  level: number
  prompt: string
}

export interface PuzzlePedagogy {
  aha_moment: string
  ctem_principle: string
  hint_sequence: HintStep[]
  framework_mapping?: string[]
}

// ── Meta ─────────────────────────────────────────────────────────────────────

export interface PuzzleMeta {
  title: string
  tier: PuzzleTier
  tier_label: TierLabel
  domain: PuzzleDomain
  season: number
  estimated_minutes: number
  author: string
  status: PuzzleStatus
  tags?: string[]
  framework_refs?: string[]
}

export interface PuzzleNarrative {
  scenario: string
  intel_brief: string
  world?: string
}

// ── Full Puzzle ───────────────────────────────────────────────────────────────

export interface Puzzle {
  id: string
  version: string
  meta: PuzzleMeta
  narrative: PuzzleNarrative
  map: PuzzleMap
  rules: PuzzleRule[]
  tokens: PuzzleTokens
  objective: PuzzleObjective
  solution: PuzzleSolution
  pedagogy: PuzzlePedagogy
}

// ── Player State ──────────────────────────────────────────────────────────────

export interface TokenPlacement {
  tokenIndex: number  // 0-based
  nodeId: string
}

export type PuzzlePhase = 'playing' | 'confirmed-wrong' | 'breach-confirmed'

export interface PuzzleState {
  puzzleId: string
  phase: PuzzlePhase
  placements: TokenPlacement[]
  hintsUsed: number
  startedAt: number   // Date.now()
  solvedAt?: number
}

// ── User Profile ──────────────────────────────────────────────────────────────

export type UserRank = 'Scout' | 'Analyst' | 'Auditor' | 'Red-Teamer' | 'Grandmaster'

export interface UserProfile {
  id: string
  displayName: string
  rank: UserRank
  atq: number           // Adversarial Thinking Quotient (0–1000)
  atqPublic: boolean    // opt-in to public leaderboard
  streak: number
  streakFreezes: number
  totalSolved: number
  solvedByDomain: Partial<Record<PuzzleDomain, number>>
  joinedAt: number
}
