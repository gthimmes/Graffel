// Re-sync a compose-sourced diagram against a freshly-generated graph. Pure and
// unit-tested. This is the "doesn't rot" half of living diagrams (ADR-0016, slice 2):
// re-import an updated docker-compose file and MERGE it into the diagram you've been
// editing — keep everything you moved/styled, add what's new, drop what's gone —
// rather than replacing your work.
//
// Matching is by the stable, source-derived ids from buildComposeGraph
// (`compose:<service>` / `ce:<a>__<b>`). Anything NOT compose-managed (a node/edge
// you drew by hand) is passed through untouched and ignored by the diff.

import type { GraffelEdge, GraffelNode } from '../types'

const NODE_PREFIX = 'compose:'
const EDGE_PREFIX = 'ce:'

/** A node/edge id is "compose-managed" when it was generated from the source. */
function isComposeNode(id: string): boolean {
  return id.startsWith(NODE_PREFIX)
}
function isComposeEdge(id: string): boolean {
  return id.startsWith(EDGE_PREFIX)
}

export interface ComposeSyncDiff {
  /** New services (node ids) added since the last sync. */
  added: string[]
  /** Services (node ids) removed from the source. */
  removed: string[]
  /** Matched services whose inferred shape changed. */
  changed: string[]
  /** Matched services with no shape change. */
  unchanged: string[]
}

export interface ComposeSyncResult {
  nodes: GraffelNode[]
  edges: GraffelEdge[]
  diff: ComposeSyncDiff
}

interface Graph {
  nodes: GraffelNode[]
  edges: GraffelEdge[]
}

const STAGE_GAP = 48

/**
 * Merge `fresh` (a newly built compose graph, positioned at the origin) into
 * `existing` (the live diagram). Returns the merged graph plus a diff summary.
 */
export function syncComposeGraph(existing: Graph, fresh: Graph): ComposeSyncResult {
  const existingById = new Map(existing.nodes.map((n) => [n.id, n]))
  const freshById = new Map(fresh.nodes.map((n) => [n.id, n]))

  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  const unchanged: string[] = []

  const merged: GraffelNode[] = []

  // 1. Pass through everything the user still has, minus compose nodes the source dropped.
  for (const node of existing.nodes) {
    if (!isComposeNode(node.id)) {
      merged.push(node) // hand-drawn — never touched
      continue
    }
    const freshNode = freshById.get(node.id)
    if (!freshNode) {
      removed.push(node.id) // was generated before, gone from the source now
      continue
    }
    // Matched: keep the user's layout + styling; adopt the freshly-inferred shape.
    const shapeChanged = freshNode.type !== node.type
    merged.push({ ...node, type: freshNode.type })
    ;(shapeChanged ? changed : unchanged).push(node.id)
  }

  // 2. Stage genuinely-new services below the existing content so nothing overlaps.
  const newNodes = fresh.nodes.filter((n) => !existingById.has(n.id))
  if (newNodes.length > 0) {
    const stage = stagingOrigin(merged)
    let x = stage.x
    for (const n of newNodes) {
      merged.push({ ...n, position: { x, y: stage.y } })
      added.push(n.id)
      x += n.size.w + STAGE_GAP
    }
  }

  // 3. Edges: keep matched compose edges (preserving manual waypoints), add new ones,
  //    drop compose edges the source no longer has. Hand-drawn edges pass through.
  const freshEdgeById = new Map(fresh.edges.map((e) => [e.id, e]))
  const mergedEdges: GraffelEdge[] = []
  for (const e of existing.edges) {
    if (!isComposeEdge(e.id)) mergedEdges.push(e)
    else if (freshEdgeById.has(e.id)) mergedEdges.push(e)
    // else: a compose edge dropped by the source — omit it
  }
  const existingEdgeIds = new Set(existing.edges.map((e) => e.id))
  for (const e of fresh.edges) {
    if (!existingEdgeIds.has(e.id)) mergedEdges.push(e)
  }

  // 4. Drop any edge (even hand-drawn) left dangling by a removal.
  const liveIds = new Set(merged.map((n) => n.id))
  const finalEdges = mergedEdges.filter((e) => liveIds.has(e.source) && liveIds.has(e.target))

  return { nodes: merged, edges: finalEdges, diff: { added, removed, changed, unchanged } }
}

/** Top-left corner of the staging area: below the current top-level content. */
function stagingOrigin(nodes: GraffelNode[]): { x: number; y: number } {
  const top = nodes.filter((n) => (n.parentId ?? null) === null)
  if (top.length === 0) return { x: 0, y: 0 }
  let minX = Infinity
  let maxY = -Infinity
  for (const n of top) {
    minX = Math.min(minX, n.position.x)
    maxY = Math.max(maxY, n.position.y + n.size.h)
  }
  return { x: minX, y: maxY + STAGE_GAP }
}
