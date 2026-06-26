// Orchestrates Mermaid import/export against the live store. Impure (runs ELK and
// touches the document library), so it sits apart from the pure parse/build/serialize
// modules and is covered end-to-end by e2e/mermaid.spec.ts.

import { layoutNested } from '../../canvas/autoLayout'
import { descendantIds, sortNodesByDepth } from '../../canvas/nesting'
import { createEmptyDocument } from '../graffelFile'
import { importDocument } from '../../store/documents'
import { useDiagramStore } from '../../store/diagramStore'
import { buildGraph } from './buildGraph'
import { parseMermaid } from './parseMermaid'
import { toMermaid } from './toMermaid'

/**
 * Parse Mermaid text, lay it out hierarchically with ELK, and open it as a new
 * document. Subgraphs become drill-down containers (sized to fit their members).
 * Throws (with a human-readable message) when the source isn't a usable flowchart.
 */
export async function importMermaidText(text: string): Promise<void> {
  const graph = parseMermaid(text)
  const { nodes, edges } = buildGraph(graph)
  if (nodes.length === 0) throw new Error('No nodes found in the Mermaid source')

  // A node is a container iff something is parented to it.
  const parents = new Set(nodes.map((n) => n.parentId).filter((p): p is string => !!p))
  const { positions, sizes } = await layoutNested(
    nodes.map((n) => ({ id: n.id, size: n.size, parentId: n.parentId ?? null, isContainer: parents.has(n.id) })),
    edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    { direction: graph.direction },
  )
  const placed = nodes.map((n) => ({
    ...n,
    position: positions[n.id] ?? n.position,
    size: sizes[n.id] ?? n.size, // containers get ELK's computed size
  }))

  const doc = createEmptyDocument()
  doc.metadata.title = 'Imported from Mermaid'
  // React Flow needs parents before children.
  doc.nodes = sortNodesByDepth(placed)
  doc.edges = edges
  importDocument(doc)
}

/**
 * Serialize the level currently in view (and everything nested below it) as
 * Mermaid text — containers come out as `subgraph` blocks, so a drilled-in
 * hierarchy round-trips.
 */
export function exportCurrentLevelMermaid(): string {
  const s = useDiagramStore.getState()
  const root = s.viewRootId ?? null
  const subtree =
    root === null ? s.nodes : s.nodes.filter((n) => descendantIds(root, s.nodes).has(n.id))
  const ids = new Set(subtree.map((n) => n.id))
  const edges = s.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
  return toMermaid(subtree, edges, { rootParentId: root })
}
