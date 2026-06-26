// Mermaid flowchart parser (v3.24, import side). Pure and unit-tested.
//
// Scope: the `graph` / `flowchart` family — the dialect architects actually paste.
// We read direction, node declarations (with the common shape wrappers) and the
// link statements (including chains and labels), and ignore styling/interaction
// directives. Subgraphs are *flattened* in v1: their nodes survive, the grouping
// is dropped (mapping subgraphs onto drill-down containers is a noted fast-follow
// — see ADR-0014). The result is a flat, semantic graph; sizing, shape-id mapping
// and layout happen downstream in buildGraph / importMermaid.

export type MermaidShape = 'rect' | 'round' | 'stadium' | 'diamond' | 'circle' | 'cylinder' | 'subgraph'

export interface MermaidNode {
  id: string
  label: string
  shape: MermaidShape
  /** Enclosing subgraph id, or null for the top level. */
  parentId: string | null
}

export interface MermaidEdge {
  source: string
  target: string
  label: string
}

export interface MermaidGraph {
  direction: 'RIGHT' | 'DOWN'
  nodes: MermaidNode[]
  edges: MermaidEdge[]
}

// A node token: an id optionally followed by a shape wrapper. Order matters —
// the multi-char wrappers must be tried before their single-char prefixes.
const NODE_RE =
  /^([A-Za-z0-9_]+)(\[\(.*?\)\]|\(\(.*?\)\)|\(\[.*?\]\)|\[\[.*?\]\]|\{\{.*?\}\}|\[.*?\]|\(.*?\)|\{.*?\}|>.*?\])?\s*/

// A link operator, optionally trailed by a `|label|`.
const LINK_RE = /^(-{2,3}>|-{2,3}|-\.->|-\.-|={2,3}>|={2,3}|--[xo])\s*(?:\|([^|]*)\|\s*)?/

const DIRECTIVE_RE = /^(style|classDef|class|linkStyle|click|direction)\b/
const SUBGRAPH_RE = /^subgraph\b\s*(.*)$/i
// A subgraph header: an id with an optional bracketed title, or free-text.
const SUBGRAPH_HEAD_RE = /^([A-Za-z0-9_]+)\s*(\[.*\]|\(.*\)|\{.*\})?\s*$/

/** Resolve a Mermaid shape wrapper to our shape kind + inner label. */
function readWrapper(wrapper: string | undefined, id: string): { shape: MermaidShape; label: string } {
  if (!wrapper) return { shape: 'rect', label: id }
  const unquote = (s: string) => s.replace(/^"(.*)"$/s, '$1').trim()
  const inner = (open: number, close: number) => unquote(wrapper.slice(open, wrapper.length - close))
  if (wrapper.startsWith('[(')) return { shape: 'cylinder', label: inner(2, 2) }
  if (wrapper.startsWith('((')) return { shape: 'circle', label: inner(2, 2) }
  if (wrapper.startsWith('([')) return { shape: 'stadium', label: inner(2, 2) }
  if (wrapper.startsWith('[[')) return { shape: 'rect', label: inner(2, 2) }
  if (wrapper.startsWith('{{')) return { shape: 'diamond', label: inner(2, 2) }
  if (wrapper.startsWith('[')) return { shape: 'rect', label: inner(1, 1) }
  if (wrapper.startsWith('(')) return { shape: 'round', label: inner(1, 1) }
  if (wrapper.startsWith('{')) return { shape: 'diamond', label: inner(1, 1) }
  if (wrapper.startsWith('>')) return { shape: 'rect', label: inner(1, 1) }
  return { shape: 'rect', label: id }
}

/** Rewrite the inline-label link form (`A -- text --> B`) into the pipe form. */
function normalizeInlineLabels(line: string): string {
  return line.replace(
    /(\s)(?:--|==|-\.)\s+([^|>]+?)\s+(-{2,3}>|-{2,3}|==?>|===|-\.->|-\.-)/g,
    (_m, sp: string, label: string, op: string) => `${sp}${op}|${label.trim()}|`,
  )
}

export function parseMermaid(text: string): MermaidGraph {
  const rawLines = text.split('\n').map((l) => l.replace(/%%.*$/, '').trim())
  const lines = rawLines.filter((l) => l.length > 0)
  if (lines.length === 0) throw new Error('Empty Mermaid source')

  const header = /^(graph|flowchart)\b\s*(TD|TB|BT|LR|RL)?/i.exec(lines[0])
  if (!header) {
    throw new Error("Not a Mermaid flowchart — expected a 'graph' or 'flowchart' header")
  }
  const dir = (header[2] ?? 'TD').toUpperCase()
  const direction: 'RIGHT' | 'DOWN' = dir === 'LR' || dir === 'RL' ? 'RIGHT' : 'DOWN'

  const nodeMap = new Map<string, MermaidNode>()
  const edges: MermaidEdge[] = []
  // Stack of enclosing subgraph ids; the top is the current parent.
  const stack: string[] = []
  let synthCount = 0

  const currentParent = () => (stack.length > 0 ? stack[stack.length - 1] : null)

  function register(id: string, wrapper: string | undefined): string {
    const existing = nodeMap.get(id)
    if (existing) {
      // A later labeled reference upgrades an earlier bare one.
      if (wrapper) {
        const { shape, label } = readWrapper(wrapper, id)
        existing.shape = shape
        existing.label = label
      }
      return id
    }
    const { shape, label } = readWrapper(wrapper, id)
    nodeMap.set(id, { id, label, shape, parentId: currentParent() })
    return id
  }

  for (const line of lines.slice(1)) {
    if (DIRECTIVE_RE.test(line)) continue

    if (/^end\b/i.test(line)) {
      stack.pop()
      continue
    }

    const sub = SUBGRAPH_RE.exec(line)
    if (sub) {
      const rest = sub[1].trim()
      const head = SUBGRAPH_HEAD_RE.exec(rest)
      let id: string
      let label: string
      if (head && head[2]) {
        id = head[1]
        label = readWrapper(head[2], head[1]).label
      } else if (head) {
        id = head[1]
        label = head[1]
      } else {
        // A title with spaces and no explicit id — synthesize a stable id.
        id = `__sg${synthCount++}`
        label = rest.replace(/^"(.*)"$/s, '$1')
      }
      // The container itself is parented to the enclosing subgraph (if any).
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, label, shape: 'subgraph', parentId: currentParent() })
      }
      stack.push(id)
      continue
    }

    let s = normalizeInlineLabels(line)
    const first = NODE_RE.exec(s)
    if (!first) continue
    let prev = register(first[1], first[2])
    s = s.slice(first[0].length)

    while (s.length > 0) {
      const link = LINK_RE.exec(s)
      if (!link) break
      const label = (link[2] ?? '').trim().replace(/^"(.*)"$/s, '$1')
      s = s.slice(link[0].length)
      const next = NODE_RE.exec(s)
      if (!next) break
      const cur = register(next[1], next[2])
      edges.push({ source: prev, target: cur, label })
      prev = cur
      s = s.slice(next[0].length)
    }
  }

  return { direction, nodes: [...nodeMap.values()], edges }
}
