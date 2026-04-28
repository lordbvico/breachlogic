// BreachLogic Puzzle Validation Engine (client-side)
// Determines whether a player's token placements constitute a valid breach path.

import type { Puzzle, TokenPlacement, PuzzleNode, PuzzleEdge } from '@/types/puzzle'

export interface ValidationResult {
  valid: boolean
  message: string
  pathFound?: string[]   // node IDs of the valid breach path
}

/**
 * Build an adjacency map from puzzle edges, respecting blocked edges.
 * A blocked edge (blocked_by = gateId) is only traversable if
 * the player has placed a token on a node that provides bypass.
 */
function buildGraph(
  edges: PuzzleEdge[],
  placements: TokenPlacement[],
  nodes: PuzzleNode[],
): Map<string, string[]> {
  const placedNodeIds = new Set(placements.map((p) => p.nodeId))
  const adj = new Map<string, string[]>()

  for (const edge of edges) {
    // Skip edges that are blocked by a gate that hasn't been bypassed
    if (edge.blocked_by) {
      // Check if the player has a token on any node that feeds INTO the bypass path
      // In BreachLogic, bypass edges exist in parallel — if a bypass path
      // (type: 'bypass' or 'trigger') reaches the same target, use it instead.
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
 * Returns the path if reachable, or null.
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
 * Main validation function called when the player hits "Confirm Breach".
 */
export function validateBreach(
  puzzle: Puzzle,
  placements: TokenPlacement[],
): ValidationResult {
  const { map, objective, solution, tokens } = puzzle

  // 1. Check correct number of tokens placed
  if (placements.length !== tokens.count) {
    return {
      valid: false,
      message: `Place all ${tokens.count} token${tokens.count !== 1 ? 's' : ''} before confirming.`,
    }
  }

  // 2. Check no tokens on locked nodes
  const lockedIds = new Set(map.nodes.filter((n) => n.locked).map((n) => n.id))
  for (const p of placements) {
    if (lockedIds.has(p.nodeId)) {
      return { valid: false, message: 'Cannot place tokens on locked nodes.' }
    }
  }

  // 3. Check whether placement matches the canonical solution
  const solutionNodeIds = new Set(solution.steps.map((s) => s.node_id))
  const placedNodeIds   = new Set(placements.map((p) => p.nodeId))

  const canonicalMatch =
    placedNodeIds.size === solutionNodeIds.size &&
    [...solutionNodeIds].every((id) => placedNodeIds.has(id))

  if (canonicalMatch) {
    const path = solution.steps.map((s) => s.node_id)
    return { valid: true, message: 'Breach confirmed.', pathFound: path }
  }

  // 4. Check alternate paths if defined
  if (solution.alternate_paths && solution.alternate_paths.length > 0) {
    // Alternate paths are described in prose — for now, fall through to graph check
  }

  // 5. Graph-based reachability check — does the player's placement create
  //    a traversable path to the target node?
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
 * Compute an ATQ delta based on puzzle performance.
 * Higher tier, fewer hints, faster time = more points.
 */
export function computeAtqDelta(
  tier: number,
  hintsUsed: number,
  elapsedMs: number,
  estimatedMinutes: number,
): number {
  const basePts   = tier * 20                                   // 20–100 base
  const hintPenalty  = hintsUsed * 8                           // -8 per hint
  const estimatedMs  = estimatedMinutes * 60 * 1000
  const speedRatio   = Math.max(0.5, Math.min(2, estimatedMs / Math.max(elapsedMs, 1)))
  const speedBonus   = Math.round((speedRatio - 1) * 10)       // -10 to +10
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
