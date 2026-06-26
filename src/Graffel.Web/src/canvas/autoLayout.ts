// One-shot "Tidy up" auto-layout (v3.20) — hierarchical placement via ELK.
//
// We lay out one level at a time: the nodes currently visible (direct children of
// the view root) plus the edges internal to that level. ELK returns a clean
// layered arrangement; we map its coordinates straight back onto our node
// positions (which, for a single level, are already parent-relative — ELK's local
// origin lines up with the level origin).
//
// The graph-building and result-mapping are pure and unit-tested; `layoutLevel`
// is the thin async wrapper around the ELK engine.

import type { ELK as ElkInstance, ElkNode } from 'elkjs/lib/elk-api'

export interface LayoutNode { id: string; size: { w: number; h: number } }
export interface LayoutEdge { id: string; source: string; target: string }
export interface LayoutOpts {
  /** Primary flow direction. 'RIGHT' = left-to-right, 'DOWN' = top-to-bottom. */
  direction?: 'RIGHT' | 'DOWN'
  /** Gap between sibling nodes in the same layer. */
  nodeSpacing?: number
  /** Gap between successive layers. */
  layerSpacing?: number
}

const DEFAULTS = { direction: 'RIGHT' as const, nodeSpacing: 60, layerSpacing: 90 }

/** Build the ELK graph JSON for one level. Pure. */
export function buildElkGraph(nodes: LayoutNode[], edges: LayoutEdge[], opts: LayoutOpts = {}): ElkNode {
  const o = { ...DEFAULTS, ...opts }
  const ids = new Set(nodes.map((n) => n.id))
  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': o.direction,
      'elk.spacing.nodeNode': String(o.nodeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(o.layerSpacing),
    },
    children: nodes.map((n) => ({ id: n.id, width: n.size.w, height: n.size.h })),
    // Only edges whose BOTH ends are in this level participate in the layout.
    edges: edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  }
}

/** Extract { nodeId: {x, y} } from a laid-out ELK graph. Pure. */
export function elkPositions(graph: ElkNode): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {}
  for (const c of graph.children ?? []) {
    if (typeof c.x === 'number' && typeof c.y === 'number') out[c.id] = { x: c.x, y: c.y }
  }
  return out
}

// ── Nested (hierarchical) layout ─────────────────────────────────────────────
// Used by Mermaid import when subgraphs map to drill-down containers. ELK lays
// out the whole tree at once: leaf nodes get positions, container nodes get a
// computed size + their children positioned *relative to the container* — which
// is exactly how we store child positions (see canvas/nesting.ts), so the result
// maps back with no coordinate conversion.

export interface NestedLayoutNode {
  id: string
  size: { w: number; h: number }
  parentId: string | null
  isContainer?: boolean
}

/** Build a hierarchical ELK graph from a flat list with parent links. Pure. */
export function buildNestedElkGraph(
  nodes: NestedLayoutNode[],
  edges: LayoutEdge[],
  opts: LayoutOpts = {},
): ElkNode {
  const o = { ...DEFAULTS, ...opts }
  const layered = {
    'elk.algorithm': 'layered',
    'elk.direction': o.direction,
    'elk.spacing.nodeNode': String(o.nodeSpacing),
    'elk.layered.spacing.nodeNodeBetweenLayers': String(o.layerSpacing),
  }

  const elkById = new Map<string, ElkNode>()
  for (const n of nodes) {
    elkById.set(
      n.id,
      n.isContainer
        // Leave room at the top for the container's label.
        ? { id: n.id, layoutOptions: { ...layered, 'elk.padding': '[top=34,left=14,bottom=14,right=14]' }, children: [] }
        : { id: n.id, width: n.size.w, height: n.size.h },
    )
  }

  const top: ElkNode[] = []
  for (const n of nodes) {
    const node = elkById.get(n.id)!
    const parent = n.parentId ? elkById.get(n.parentId) : undefined
    if (parent) (parent.children ??= []).push(node)
    else top.push(node)
  }

  const ids = new Set(nodes.map((n) => n.id))
  return {
    id: 'root',
    layoutOptions: { ...layered, 'elk.hierarchyHandling': 'INCLUDE_CHILDREN' },
    children: top,
    edges: edges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  }
}

/** Walk a laid-out nested graph: positions for every node, sizes for containers. Pure. */
export function elkNestedResult(graph: ElkNode): {
  positions: Record<string, { x: number; y: number }>
  sizes: Record<string, { w: number; h: number }>
} {
  const positions: Record<string, { x: number; y: number }> = {}
  const sizes: Record<string, { w: number; h: number }> = {}
  const walk = (parent: ElkNode) => {
    for (const c of parent.children ?? []) {
      if (typeof c.x === 'number' && typeof c.y === 'number') positions[c.id] = { x: c.x, y: c.y }
      if (c.children && c.children.length > 0) {
        if (typeof c.width === 'number' && typeof c.height === 'number') {
          sizes[c.id] = { w: c.width, h: c.height }
        }
        walk(c)
      }
    }
  }
  walk(graph)
  return { positions, sizes }
}

/** Run hierarchical ELK; return parent-relative positions + computed container sizes. */
export async function layoutNested(
  nodes: NestedLayoutNode[],
  edges: LayoutEdge[],
  opts: LayoutOpts = {},
): Promise<{ positions: Record<string, { x: number; y: number }>; sizes: Record<string, { w: number; h: number }> }> {
  if (nodes.length === 0) return { positions: {}, sizes: {} }
  const elk = await getElk()
  const result = await elk.layout(buildNestedElkGraph(nodes, edges, opts))
  return elkNestedResult(result)
}

// ELK is ~1.4MB — load it lazily on first use so it splits into its own chunk
// instead of bloating the initial bundle.
let elkPromise: Promise<ElkInstance> | null = null
function getElk(): Promise<ElkInstance> {
  if (!elkPromise) {
    elkPromise = import('elkjs/lib/elk.bundled.js').then((m) => new m.default())
  }
  return elkPromise
}

/** Run ELK on one level and return new positions keyed by node id. */
export async function layoutLevel(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  opts: LayoutOpts = {},
): Promise<Record<string, { x: number; y: number }>> {
  if (nodes.length === 0) return {}
  const elk = await getElk()
  const result = await elk.layout(buildElkGraph(nodes, edges, opts))
  return elkPositions(result)
}
