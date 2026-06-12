import type { GraffelEdge, GraffelNode } from '../format/types'
import type { NodeIndex } from './nesting'

/**
 * Drill-down view math (pure). A "level" is the canvas scoped to one container's
 * subtree (`viewRootId`; null = the whole diagram). Collapsed containers hide
 * their subtree at any level, and edges into hidden nodes re-target to the
 * nearest visible ancestor. All of this is a VIEW concern — the stored model
 * (parentId + parent-relative positions) is untouched by drilling.
 */

function isCollapsed(n: GraffelNode): boolean {
  return (n.data as { collapsed?: boolean }).collapsed === true
}

/**
 * The set of node ids rendered for a view root: descendants of `viewRootId`
 * (every node when null), except that a collapsed container's subtree is hidden
 * (the collapsed container itself stays visible). The view root itself is not
 * rendered — its children appear as the level's top-level nodes.
 */
export function visibleNodeIds(nodes: GraffelNode[], viewRootId: string | null): Set<string> {
  const byParent = new Map<string | null, GraffelNode[]>()
  for (const n of nodes) {
    const p = n.parentId ?? null
    const list = byParent.get(p)
    if (list) list.push(n)
    else byParent.set(p, [n])
  }
  const out = new Set<string>()
  const walk = (parentId: string | null) => {
    for (const n of byParent.get(parentId) ?? []) {
      out.add(n.id)
      if (!isCollapsed(n)) walk(n.id)
    }
  }
  walk(viewRootId)
  return out
}

/**
 * The visible stand-in for a node: itself when visible, else the nearest visible
 * ancestor (e.g. the collapsed container hiding it), else null (the node lives
 * outside the current drilled subtree).
 */
export function visibleRepresentative(
  id: string,
  visible: Set<string>,
  byId: NodeIndex,
): string | null {
  let cur: string | null = id
  const seen = new Set<string>()
  while (cur && !seen.has(cur)) {
    if (visible.has(cur)) return cur
    seen.add(cur)
    cur = byId.get(cur)?.parentId ?? null
  }
  return null
}

/**
 * How an edge renders in the current view: endpoints remapped to their visible
 * representatives, or null to drop it (an endpoint has no representative here,
 * or both collapse onto the same node).
 */
export function remapEdgeForView(
  edge: GraffelEdge,
  visible: Set<string>,
  byId: NodeIndex,
): { source: string; target: string } | null {
  const source = visibleRepresentative(edge.source, visible, byId)
  const target = visibleRepresentative(edge.target, visible, byId)
  if (!source || !target || source === target) return null
  return { source, target }
}
