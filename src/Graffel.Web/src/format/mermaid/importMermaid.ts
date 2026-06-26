// Orchestrates Mermaid import/export against the live store. Impure (runs ELK and
// touches the document library), so it sits apart from the pure parse/build/serialize
// modules and is covered end-to-end by e2e/mermaid.spec.ts.

import { layoutLevel } from '../../canvas/autoLayout'
import { createEmptyDocument } from '../graffelFile'
import { importDocument } from '../../store/documents'
import { useDiagramStore } from '../../store/diagramStore'
import { buildGraph } from './buildGraph'
import { parseMermaid } from './parseMermaid'
import { toMermaid } from './toMermaid'

/**
 * Parse Mermaid text, lay it out with ELK, and open it as a new document.
 * Throws (with a human-readable message) when the source isn't a usable flowchart.
 */
export async function importMermaidText(text: string): Promise<void> {
  const graph = parseMermaid(text)
  const { nodes, edges } = buildGraph(graph)
  if (nodes.length === 0) throw new Error('No nodes found in the Mermaid source')

  const positions = await layoutLevel(
    nodes.map((n) => ({ id: n.id, size: n.size })),
    edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    { direction: graph.direction },
  )
  const placed = nodes.map((n) => ({ ...n, position: positions[n.id] ?? n.position }))

  const doc = createEmptyDocument()
  doc.metadata.title = 'Imported from Mermaid'
  doc.nodes = placed
  doc.edges = edges
  importDocument(doc)
}

/** Serialize the level currently in view as Mermaid text. */
export function exportCurrentLevelMermaid(): string {
  const s = useDiagramStore.getState()
  const root = s.viewRootId ?? null
  const levelNodes = s.nodes.filter((n) => (n.parentId ?? null) === root)
  const ids = new Set(levelNodes.map((n) => n.id))
  const levelEdges = s.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
  return toMermaid(levelNodes, levelEdges)
}
