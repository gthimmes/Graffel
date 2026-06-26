// Mermaid flowchart serializer (v3.24, export side). Pure and unit-tested.
//
// Maps a flat set of Graffel nodes + edges (typically one drill-down level) onto
// Mermaid `graph` text. Node ids are opaque (ulid-based), so we alias them to
// short stable names (N0, N1, …); labels are emitted in quoted form so arbitrary
// punctuation survives. Shape kind is derived from the node's registry type.

import type { GraffelEdge, GraffelNode } from '../types'

export interface ToMermaidOpts {
  /** Primary flow direction. 'DOWN' → `graph TD`, 'RIGHT' → `graph LR`. */
  direction?: 'RIGHT' | 'DOWN'
}

/** Wrap a label so any punctuation is safe inside the chosen brackets. */
function quote(label: string): string {
  return `"${label.replace(/"/g, '&quot;')}"`
}

/** Pick the Mermaid bracket pair for a node, by its registry type. */
function wrap(type: string, label: string): string {
  const q = quote(label)
  if (type.endsWith(':diamond')) return `{${q}}`
  if (type.endsWith(':ellipse')) return `((${q}))`
  if (type.endsWith(':database') || type.endsWith(':queue')) return `[(${q})]`
  // rectangle, text, containers, services, everything else → plain box.
  return `[${q}]`
}

export function toMermaid(nodes: GraffelNode[], edges: GraffelEdge[], opts: ToMermaidOpts = {}): string {
  const direction = opts.direction ?? 'DOWN'
  const header = `graph ${direction === 'RIGHT' ? 'LR' : 'TD'}`

  const alias = new Map<string, string>()
  nodes.forEach((n, i) => alias.set(n.id, `N${i}`))

  const lines = [header]

  for (const n of nodes) {
    const a = alias.get(n.id)!
    const label = n.data.label?.trim() ? n.data.label : a
    lines.push(`  ${a}${wrap(n.type, label)}`)
  }

  for (const e of edges) {
    const s = alias.get(e.source)
    const t = alias.get(e.target)
    if (!s || !t) continue // edge to a node outside this level — skip
    const label = e.data.label?.trim() ? `|${quote(e.data.label)}|` : ''
    lines.push(`  ${s} -->${label ? label + ' ' : ' '}${t}`)
  }

  return lines.join('\n')
}
