// Mermaid flowchart serializer (v3.24 / v3.25, export side). Pure and unit-tested.
//
// Maps a Graffel subtree (nodes + edges) onto Mermaid `graph` text. Node ids are
// opaque (ulid-based), so we alias them to short stable names (N0, N1, …); labels
// are emitted quoted so arbitrary punctuation survives. Container nodes (those
// that parent other nodes in the set) become `subgraph … end` blocks, so a
// drill-down hierarchy round-trips as nested subgraphs.

import type { GraffelEdge, GraffelNode } from '../types'

export interface ToMermaidOpts {
  /** Primary flow direction. 'DOWN' → `graph TD`, 'RIGHT' → `graph LR`. */
  direction?: 'RIGHT' | 'DOWN'
  /** Which nodes count as top-level: those whose parentId equals this. Default null (root). */
  rootParentId?: string | null
}

/** Wrap a label so any punctuation is safe inside the chosen brackets. */
function quote(label: string): string {
  return `"${label.replace(/"/g, '&quot;')}"`
}

/** Pick the Mermaid bracket pair for a leaf node, by its registry type. */
function wrap(type: string, label: string): string {
  const q = quote(label)
  if (type.endsWith(':diamond')) return `{${q}}`
  if (type.endsWith(':ellipse')) return `((${q}))`
  if (type.endsWith(':database') || type.endsWith(':queue')) return `[(${q})]`
  return `[${q}]`
}

export function toMermaid(nodes: GraffelNode[], edges: GraffelEdge[], opts: ToMermaidOpts = {}): string {
  const direction = opts.direction ?? 'DOWN'
  const rootParentId = opts.rootParentId ?? null
  const header = `graph ${direction === 'RIGHT' ? 'LR' : 'TD'}`

  const alias = new Map<string, string>()
  nodes.forEach((n, i) => alias.set(n.id, `N${i}`))

  // Group by parent so we can recurse; a node is a container iff it has children
  // present in this set (an empty group exports as a plain box).
  const childrenOf = new Map<string | null, GraffelNode[]>()
  for (const n of nodes) {
    const key = n.parentId ?? null
    ;(childrenOf.get(key) ?? childrenOf.set(key, []).get(key)!).push(n)
  }
  const isContainer = (id: string) => (childrenOf.get(id)?.length ?? 0) > 0

  const lines = [header]

  const emit = (parentId: string | null, indent: string) => {
    for (const n of childrenOf.get(parentId) ?? []) {
      const a = alias.get(n.id)!
      const label = n.data.label?.trim() ? n.data.label : a
      if (isContainer(n.id)) {
        lines.push(`${indent}subgraph ${a}[${quote(label)}]`)
        emit(n.id, indent + '  ')
        lines.push(`${indent}end`)
      } else {
        lines.push(`${indent}${a}${wrap(n.type, label)}`)
      }
    }
  }
  emit(rootParentId, '  ')

  for (const e of edges) {
    const s = alias.get(e.source)
    const t = alias.get(e.target)
    if (!s || !t) continue // endpoint outside the exported subtree — skip
    const label = e.data.label?.trim() ? `|${quote(e.data.label)}|` : ''
    lines.push(`  ${s} -->${label ? label + ' ' : ' '}${t}`)
  }

  return lines.join('\n')
}
