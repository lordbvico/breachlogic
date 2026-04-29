// BreachLogic Puzzle Validation Engine (client-side)
// Determines whether a player's token placements constitute a valid breach path.

import type { Puzzle, TokenPlacement, PuzzleNode, PuzzleEdge, PuzzleRule, SeamType, NodePrivilege } from '@/types/puzzle'

export interface ValidationResult {
  valid: boolean
  message: string
  pathFound?: string[]   // node IDs of the valid breach path
}

/**
 * Build an adjacency map from puzzle edges, respecting blocked edges.
 */
function buildGraph(
  edges: PuzzleEdge[],
  placements: TokenPlacement[],
  nodes: PuzzleNode[],
): Map<string, string[]> {
  const placedNodeIds = new Set(placements.map((p) => p.nodeId))
  const adj = new Map<string, string[]>()

  for (const edge of edges) {
    if (edge.blocked_by) {
      const hasBypassPath = edges.some(
        (e) =>
          e.to === edge.to &&
          (e.type === 'bypass' || e.type === 'trigger') &&
          placedNodeIds.has(e.from),
      )
      if (!hasBypassPath) continue
    }

    if (!adj.has(edge.from)) adj.set(edge.from, [])
    adj.get(edge.from)!.push(edge.to)
  }

  return adj
}

/**
 * BFS from any actor/starting node to the target node.
 */
function bfsPath(
  start: string,
  goal: string,
  adj: Map<string, string[]>,
): string[] | null {
  const queue: string[][] = [[start]]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const path = queue.shift()!
    const current = path[path.length - 1]

    if (current === goal) return path
    if (visited.has(current)) continue
    visited.add(current)

    for (const neighbor of adj.get(current) ?? []) {
      queue.push([...path, neighbor])
    }
  }

  return null
}

/**
 * Main validation function.
 */
export function validateBreach(
  puzzle: Puzzle,
  placements: TokenPlacement[],
): ValidationResult {
  const { map, objective, solution, tokens } = puzzle

  if (placements.length !== tokens.count) {
    return {
      valid: false,
      message: `Place all ${tokens.count} token${tokens.count !== 1 ? 's' : ''} before confirming.`,
    }
  }

  const lockedIds = new Set(map.nodes.filter((n) => n.locked).map((n) => n.id))
  for (const p of placements) {
    if (lockedIds.has(p.nodeId)) {
      return { valid: false, message: 'Cannot place tokens on locked nodes.' }
    }
  }

  const solutionNodeIds = new Set(solution.steps.map((s) => s.node_id))
  const placedNodeIds   = new Set(placements.map((p) => p.nodeId))

  const canonicalMatch =
    placedNodeIds.size === solutionNodeIds.size &&
    [...solutionNodeIds].every((id) => placedNodeIds.has(id))

  if (canonicalMatch) {
    const path = solution.steps.map((s) => s.node_id)
    return { valid: true, message: 'Breach confirmed.', pathFound: path }
  }

  const startNodes = map.nodes
    .filter((n) => n.type === 'actor' && !n.locked)
    .map((n) => n.id)

  const adj = buildGraph(map.edges, placements, map.nodes)

  for (const start of startNodes) {
    const path = bfsPath(start, objective.target_node, adj)
    if (path) {
      return { valid: true, message: 'Breach confirmed via alternate path.', pathFound: path }
    }
  }

  return {
    valid: false,
    message: 'No valid breach path found. Review the logic gates and try again.',
  }
}

/**
 * Compute ATQ delta based on puzzle performance.
 */
export function computeAtqDelta(
  tier: number,
  hintsUsed: number,
  elapsedMs: number,
  estimatedMinutes: number,
): number {
  const basePts      = tier * 20
  const hintPenalty  = hintsUsed * 8
  const estimatedMs  = estimatedMinutes * 60 * 1000
  const speedRatio   = Math.max(0.5, Math.min(2, estimatedMs / Math.max(elapsedMs, 1)))
  const speedBonus   = Math.round((speedRatio - 1) * 10)
  return Math.max(1, basePts - hintPenalty + speedBonus)
}

/**
 * Format elapsed time as mm:ss string.
 */
export function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Multiple Choice & Repair Mode ─────────────────────────────────────────────

export interface MCChoice {
  id: string
  label: string      // "Node A → Node B → Node C"
  nodeIds: string[]
  isCorrect: boolean
}

export interface RepairChoice {
  id: string
  text: string         // description of the proposed fix
  isCorrect: boolean
  explanation: string  // shown after submission
}

/** Deterministic shuffle seeded by a string (puzzle ID). */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr]
  let h = 0
  for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0
  for (let i = result.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0
    const j = h % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Build a human-readable path label, excluding actor nodes.
 * Actors are the starting point (the "who"), not the exploit steps (the "how").
 */
function buildPathLabel(nodeIds: string[], nodes: PuzzleNode[]): string {
  const displayIds = nodeIds.filter((id) => {
    const n = nodes.find((node) => node.id === id)
    return n && n.type !== 'actor'
  })
  if (displayIds.length === 0) return 'No clear breach path'
  return displayIds
    .map((id) => nodes.find((n) => n.id === id)?.label ?? id)
    .join(' → ')
}

/**
 * Generate 4 multiple-choice path options for a puzzle.
 * Correct answer = canonical solution path.
 * Distractors swap 1–2 nodes from a pool that includes ALL non-actor, non-target,
 * non-locked nodes (gates, processes, systems) so every option is meaningful.
 */
export function generateMCChoices(puzzle: Puzzle): MCChoice[] {
  const { solution, map } = puzzle
  const solutionIds = solution.steps.map((s) => s.node_id)
  const solutionSet = new Set(solutionIds)

  // Pool: all non-actor, non-target, non-locked nodes — includes gates & processes
  const candidatePool = map.nodes
    .filter((n) => n.type !== 'actor' && n.type !== 'target' && !n.locked)
    .map((n) => n.id)
  const nonSolution = candidatePool.filter((id) => !solutionSet.has(id))

  // The "swappable" ids in the solution are the non-actor ones
  const swappableSolutionIds = solutionIds.filter((id) => {
    const n = map.nodes.find((node) => node.id === id)
    return n && n.type !== 'actor'
  })

  const correctLabel = buildPathLabel(solutionIds, map.nodes)

  const correct: MCChoice = {
    id: 'correct',
    label: correctLabel,
    nodeIds: solutionIds,
    isCorrect: true,
  }

  const usedLabels = new Set<string>([correctLabel])
  const distractors: MCChoice[] = []

  for (let attempt = 0; attempt < 80 && distractors.length < 3; attempt++) {
    const swapCount = distractors.length === 0 ? 1 : Math.min(2, swappableSolutionIds.length)
    // Work in the swappable slice, then reconstruct full nodeIds
    const swappableCandidate = [...swappableSolutionIds]

    for (let s = 0; s < swapCount; s++) {
      const swapIdx     = (attempt + s) % swappableCandidate.length
      const replacement = nonSolution.length > 0
        ? nonSolution[(attempt * 3 + s * 7) % nonSolution.length]
        : undefined
      if (replacement) swappableCandidate[swapIdx] = replacement
    }

    // Re-insert actor node(s) at the front (they stay in nodeIds for canvas highlight)
    const actorIds = solutionIds.filter((id) => {
      const n = map.nodes.find((node) => node.id === id)
      return n?.type === 'actor'
    })
    const candidateNodeIds = [...actorIds, ...swappableCandidate]

    const label = buildPathLabel(candidateNodeIds, map.nodes)

    if (!usedLabels.has(label)) {
      usedLabels.add(label)
      distractors.push({
        id: `wrong-${distractors.length}`,
        label,
        nodeIds: candidateNodeIds,
        isCorrect: false,
      })
    }
  }

  // Fallback: reversed path
  if (distractors.length < 3 && swappableSolutionIds.length > 1) {
    const reversed = [...swappableSolutionIds].reverse()
    const actorIds = solutionIds.filter((id) => {
      const n = map.nodes.find((node) => node.id === id)
      return n?.type === 'actor'
    })
    const revLabel = buildPathLabel([...actorIds, ...reversed], map.nodes)
    if (!usedLabels.has(revLabel)) {
      usedLabels.add(revLabel)
      distractors.push({
        id: 'wrong-rev',
        label: revLabel,
        nodeIds: [...actorIds, ...reversed],
        isCorrect: false,
      })
    }
  }
  while (distractors.length < 3) {
    distractors.push({
      id: `fallback-${distractors.length}`,
      label: 'No clear exploit path',
      nodeIds: [],
      isCorrect: false,
    })
  }

  return seededShuffle([correct, ...distractors], puzzle.id)
}

/**
 * Generate 4 repair-mode choices for a puzzle.
 * The correct answer describes the actual fix for the seam.
 * Distractors are plausible but ineffective fixes.
 */
export function generateRepairChoices(puzzle: Puzzle): RepairChoice[] {
  const { rules, solution, pedagogy } = puzzle
  const solutionNodeIds = new Set(solution.steps.map((s) => s.node_id))

  // Find the seam rule: the rule whose gate_id is a node on the solution path
  const seamRule =
    rules.find((r) => solutionNodeIds.has(r.gate_id)) ??
    rules[rules.length - 1]
  const otherRules = rules.filter((r) => r.id !== seamRule.id)

  const correct: RepairChoice = {
    id: 'correct',
    text: getCorrectFixText(solution.seam_type as SeamType, seamRule.label),
    isCorrect: true,
    explanation: pedagogy.aha_moment,
  }

  const pool = otherRules.length >= 3 ? otherRules : rules
  const wrongFixes = buildDistractorFixes(pool)

  const wrong: RepairChoice[] = wrongFixes.slice(0, 3).map((f, i) => ({
    id: `wrong-${i}`,
    text: f.text,
    isCorrect: false,
    explanation: f.why,
  }))

  return seededShuffle([correct, ...wrong], puzzle.id + '-repair')
}

function getCorrectFixText(seamType: SeamType, ruleLabel: string): string {
  const map: Record<SeamType, string> = {
    'missing-clause':
      `Add an explicit DENY branch to "${ruleLabel}" covering the unhandled case`,
    'policy-contradiction':
      `Add a conflict-resolution priority order so "${ruleLabel}" cannot be circumvented`,
    'privilege-escalation':
      `Restrict "${ruleLabel}" so no delegated permission exceeds the granter's own access level`,
    'race-condition':
      `Add an idempotency guard to "${ruleLabel}" that blocks concurrent state bypass`,
    'delegation-chain':
      `Cap delegation depth in "${ruleLabel}" to one level and prohibit re-delegation`,
    'scope-confusion':
      `Tighten "${ruleLabel}" with explicit resource-level boundaries instead of role checks alone`,
    'ai-logic-chain':
      `Insert a human-in-the-loop approval gate after "${ruleLabel}" for any privileged output`,
    'social-engineering':
      `Add a second verification step to "${ruleLabel}" that cannot be faked by display-name or caller ID alone`,
  }
  return map[seamType] ?? `Strengthen the condition in "${ruleLabel}" to close the logical gap`
}

function buildDistractorFixes(rules: PuzzleRule[]): Array<{ text: string; why: string }> {
  const templates: Array<(r: PuzzleRule) => { text: string; why: string }> = [
    (r) => ({
      text: `Enable detailed audit logging on "${r.label}" to detect violations after the fact`,
      why: `Audit logging improves visibility but does not prevent the breach — the logical gap in the policy remains open and exploitable.`,
    }),
    (r) => ({
      text: `Require multi-factor authentication for all actors covered by "${r.label}"`,
      why: `MFA strengthens identity verification but does not address the structural policy flaw — an attacker who passes MFA can still exploit the seam.`,
    }),
    (r) => ({
      text: `Remove "${r.label}" entirely and rely on the default-deny baseline`,
      why: `Removing this rule would break legitimate access flows that depend on it. The seam originates in a different rule's missing clause.`,
    }),
    (r) => ({
      text: `Add a 24-hour review window before "${r.label}" takes effect`,
      why: `A delay narrows the exploitation window but leaves the underlying policy gap open. A determined attacker can simply wait.`,
    }),
  ]
  return rules.slice(0, 4).map((r, i) => templates[i % templates.length](r))
}

// ── Repair Visualization ───────────────────────────────────────────────────────

export interface RepairVisualization {
  /** Extra nodes to append to the graph showing the applied fix. */
  nodes: PuzzleNode[]
  /** Extra edges to append showing how the fix reconnects. */
  edges: PuzzleEdge[]
  /** IDs of bypass/trigger edges that are now blocked by the fix. */
  blockedEdgeIds: string[]
}

/**
 * Builds a visual representation of the repair fix applied to the puzzle graph.
 * Returns extra nodes/edges to add to the canvas after a correct repair choice.
 */
export function buildRepairVisualization(puzzle: Puzzle): RepairVisualization {
  const solutionNodeIds = new Set(puzzle.solution.steps.map((s) => s.node_id))

  // Find the seam rule — the rule whose gate is on the solution path
  const seamRule =
    puzzle.rules.find((r) => solutionNodeIds.has(r.gate_id)) ??
    puzzle.rules[puzzle.rules.length - 1]

  const gateNode = puzzle.map.nodes.find((n) => n.id === seamRule.gate_id)

  // Find bypass/trigger edges that create the exploit path
  const exploitEdgeIds = puzzle.map.edges
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.type === 'bypass' || e.type === 'trigger')
    .map(({ i }) => `e-${i}`)

  if (!gateNode) return { nodes: [], edges: [], blockedEdgeIds: exploitEdgeIds }

  // Position the fix node below-right of the seam gate
  const fixPos = {
    x: gateNode.position.x + 30,
    y: gateNode.position.y + 120,
  }

  const fixNode: PuzzleNode = {
    id: '__repair_fix__',
    label: 'Security Fix',
    sublabel: seamRule.label,
    type: 'process',
    position: fixPos,
    privilege: 'system' as NodePrivilege,
    token_slot: false,
    locked: false,
  }

  const fixEdge: PuzzleEdge = {
    from: seamRule.gate_id,
    to: '__repair_fix__',
    type: 'condition',
    label: 'DENY (patched)',
  }

  return {
    nodes: [fixNode],
    edges: [fixEdge],
    blockedEdgeIds: exploitEdgeIds,
  }
}
