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
