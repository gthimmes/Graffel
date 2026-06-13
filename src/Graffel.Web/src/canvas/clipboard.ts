import type { GraffelEdge, GraffelNode } from '../format/types'
import { descendantIds } from './nesting'

/**
 * Structural clipboard (v3.15). Copy serializes the selection — including
 * container descendants and the edges that stay inside the copied set — into a
 * tagged JSON fragment that travels through the SYSTEM clipboard, so paste works
 * across tabs and across diagrams. Paste materializes the fragment with fresh
 * ids at a target position/level.
 */

export const CLIPBOARD_FORMAT = 'graffel-clipboard' as const
export const CLIPBOARD_VERSION = 1 as const

export interface ClipboardFragment {
  format: typeof CLIPBOARD_FORMAT
  version: number
  /** Fragment-root positions are normalized to the copied bbox origin; nested
   *  children keep their parent-relative positions. */
  nodes: GraffelNode[]
  /** Only edges with both endpoints inside the copied node set. */
  edges: GraffelEdge[]
}

export function isClipboardFragment(value: unknown): value is ClipboardFragment {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return v.format === CLIPBOARD_FORMAT && Array.isArray(v.nodes) && Array.isArray(v.edges)
}

export function buildFragment(
  nodes: GraffelNode[],
  edges: GraffelEdge[],
  selectedNodeIds: string[],
): ClipboardFragment {
  // The copied set: the selection plus every descendant (containers travel with
  // their contents).
  const copied = new Set<string>()
  for (const id of selectedNodeIds) {
    if (nodes.some((n) => n.id === id)) copied.add(id)
    for (const d of descendantIds(id, nodes)) copied.add(d)
  }

  const members = nodes.filter((n) => copied.has(n.id))
  // Fragment roots = copied nodes whose parent is NOT in the copied set.
  const isRoot = (n: GraffelNode) => !(n.parentId && copied.has(n.parentId))

  // Normalize root positions to the bbox origin so paste-at-cursor is a plain
  // offset. (Roots in one copy share a coordinate frame: their common level.)
  let minX = Infinity
  let minY = Infinity
  for (const n of members) {
    if (!isRoot(n)) continue
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
  }

  const outNodes = members.map((n) => ({
    ...structuredClone(n),
    parentId: isRoot(n) ? null : n.parentId,
    position: isRoot(n)
      ? { x: n.position.x - minX, y: n.position.y - minY }
      : { ...n.position },
  }))

  const outEdges = edges
    .filter((e) => copied.has(e.source) && copied.has(e.target))
    .map((e) => structuredClone(e))

  return { format: CLIPBOARD_FORMAT, version: CLIPBOARD_VERSION, nodes: outNodes, edges: outEdges }
}

export function materializeFragment(
  fragment: ClipboardFragment,
  opts: {
    /** Fresh-id factory, injected so tests stay deterministic. */
    idFor: (oldId: string) => string
    /** Where the fragment's bbox origin lands (in the paste level's frame). */
    basePosition: { x: number; y: number }
    /** The level the pasted roots belong to (null = diagram root). */
    parentId: string | null
  },
): { nodes: GraffelNode[]; edges: GraffelEdge[] } {
  const idMap = new Map<string, string>()
  for (const n of fragment.nodes) idMap.set(n.id, opts.idFor(n.id))

  const nodes = fragment.nodes.map((n) => {
    const isRoot = !(n.parentId && idMap.has(n.parentId))
    return {
      ...structuredClone(n),
      id: idMap.get(n.id)!,
      parentId: isRoot ? opts.parentId : idMap.get(n.parentId!)!,
      position: isRoot
        ? { x: n.position.x + opts.basePosition.x, y: n.position.y + opts.basePosition.y }
        : { ...n.position },
    }
  })

  const edges = fragment.edges
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((e) => ({
      ...structuredClone(e),
      id: opts.idFor(e.id),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }))

  return { nodes, edges }
}
