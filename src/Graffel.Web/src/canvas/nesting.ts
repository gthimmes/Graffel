import type { GraffelNode } from '../format/types'

/** A rectangle in absolute canvas coords. */
export interface Rect { x: number; y: number; w: number; h: number }

/** id → node lookup, for walking parent chains. */
export type NodeIndex = Map<string, GraffelNode>

export function indexNodes(nodes: GraffelNode[]): NodeIndex {
  return new Map(nodes.map((n) => [n.id, n]))
}

/**
 * A node's absolute top-left in canvas coords. Child positions are stored
 * relative to their parent, so we walk the parentId chain summing offsets. The
 * `seen` guard makes a malformed cyclic parentId terminate instead of hanging.
 */
export function absolutePosition(node: GraffelNode, byId: NodeIndex): { x: number; y: number } {
  let x = node.position.x
  let y = node.position.y
  let parentId = node.parentId ?? null
  const seen = new Set<string>([node.id])
  while (parentId) {
    if (seen.has(parentId)) break
    const parent = byId.get(parentId)
    if (!parent) break
    x += parent.position.x
    y += parent.position.y
    seen.add(parentId)
    parentId = parent.parentId ?? null
  }
  return { x, y }
}

export function absoluteRect(node: GraffelNode, byId: NodeIndex): Rect {
  const p = absolutePosition(node, byId)
  return { x: p.x, y: p.y, w: node.size.w, h: node.size.h }
}

export function toRelative(
  abs: { x: number; y: number },
  parentAbs: { x: number; y: number },
): { x: number; y: number } {
  return { x: abs.x - parentAbs.x, y: abs.y - parentAbs.y }
}

export function toAbsolute(
  rel: { x: number; y: number },
  parentAbs: { x: number; y: number },
): { x: number; y: number } {
  return { x: rel.x + parentAbs.x, y: rel.y + parentAbs.y }
}

/** Length of a node's parent chain (0 for top-level). */
function depth(node: GraffelNode, byId: NodeIndex): number {
  let d = 0
  let parentId = node.parentId ?? null
  const seen = new Set<string>([node.id])
  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId)
    if (!parent) break
    d += 1
    seen.add(parentId)
    parentId = parent.parentId ?? null
  }
  return d
}

/**
 * Parents before children — React Flow requires a parent node to appear earlier
 * in the array than any node that references it via parentId. Stable within a
 * depth level so unrelated ordering (palette/z) is preserved.
 */
export function sortNodesByDepth(nodes: GraffelNode[]): GraffelNode[] {
  const byId = indexNodes(nodes)
  return nodes
    .map((n, i) => ({ n, i, d: depth(n, byId) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.n)
}

/** All transitive descendants of `id` (children, grandchildren, …). */
export function descendantIds(id: string, nodes: GraffelNode[]): Set<string> {
  const out = new Set<string>()
  let added = true
  // Fixed-point sweep: cheap for the small node counts we deal with, and robust
  // to input ordering (a grandchild may precede its parent in the array).
  while (added) {
    added = false
    for (const n of nodes) {
      const parent = n.parentId ?? null
      if (!parent) continue
      if ((parent === id || out.has(parent)) && !out.has(n.id)) {
        out.add(n.id)
        added = true
      }
    }
  }
  return out
}

/**
 * The innermost (smallest-area) container node whose absolute box contains the
 * given rect's center — used to decide which container a dropped node nests into.
 * Non-containers and excluded ids (the dragged node itself + its descendants, to
 * prevent self-nesting cycles) are skipped.
 */
export function innermostContainerAt(
  rect: Rect,
  nodes: GraffelNode[],
  byId: NodeIndex,
  opts: { isContainer: (n: GraffelNode) => boolean; excludeIds: Set<string> },
): GraffelNode | null {
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  let best: GraffelNode | null = null
  let bestArea = Infinity
  for (const n of nodes) {
    if (opts.excludeIds.has(n.id)) continue
    if (!opts.isContainer(n)) continue
    const r = absoluteRect(n, byId)
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
      const area = r.w * r.h
      if (area < bestArea) {
        bestArea = area
        best = n
      }
    }
  }
  return best
}
