// Orchestrates docker-compose import against the live store. Impure (runs ELK and
// touches the document library), so it sits apart from the pure parse/build modules
// and is covered end-to-end by e2e/compose.spec.ts.
//
// This is the "generate" half of living diagrams (ADR-0016): point Graffel at a
// compose file and get an auto-laid-out architecture diagram. Provenance (the source
// text) is stored on the document so a later slice can re-sync it in place.

import { layoutNested } from '../../canvas/autoLayout'
import { createEmptyDocument } from '../graffelFile'
import { importDocument } from '../../store/documents'
import { buildComposeGraph } from './buildComposeGraph'
import { parseCompose } from './parseCompose'

/**
 * Parse a docker-compose file, infer shapes, lay it out with ELK, and open it as a
 * new document. Throws (with a human-readable message) when the source isn't a
 * usable compose file.
 */
export async function importComposeText(text: string, now = new Date().toISOString()): Promise<void> {
  const model = parseCompose(text)
  const { nodes, edges } = buildComposeGraph(model)
  if (nodes.length === 0) throw new Error('No services found in the compose file')

  const { positions } = await layoutNested(
    nodes.map((n) => ({ id: n.id, size: n.size, parentId: null })),
    edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    { direction: 'RIGHT' },
  )
  const placed = nodes.map((n) => ({ ...n, position: positions[n.id] ?? n.position }))

  const doc = createEmptyDocument()
  doc.metadata.title = 'Imported from docker-compose'
  doc.metadata.source = { kind: 'compose', text, importedAt: now }
  doc.nodes = placed
  doc.edges = edges
  importDocument(doc)
}
