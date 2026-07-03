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
import { useDiagramStore } from '../../store/diagramStore'
import { saveDocument } from '../../store/persistence'
import { buildComposeGraph } from './buildComposeGraph'
import { parseCompose } from './parseCompose'
import { syncComposeGraph, type ComposeSyncDiff } from './syncCompose'

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

/**
 * Re-sync the current (compose-sourced) diagram against an updated compose file:
 * MERGE the freshly-generated graph into what's on the canvas — preserving manual
 * layout/styling on services that still exist, staging new ones, dropping gone
 * ones — instead of replacing the diagram. Undoable (one step). Returns the diff so
 * the UI can tell the user what changed. Throws on an unusable compose file.
 */
export function resyncComposeFromText(text: string, now = new Date().toISOString()): ComposeSyncDiff {
  const store = useDiagramStore.getState()
  const fresh = buildComposeGraph(parseCompose(text))
  if (fresh.nodes.length === 0) throw new Error('No services found in the compose file')

  const { nodes, edges, diff } = syncComposeGraph({ nodes: store.nodes, edges: store.edges }, fresh)
  store.replaceGraph(nodes, edges)
  // Remember the new source so the next re-sync diffs against the latest file.
  store.setDocumentSource({ kind: 'compose', text, importedAt: now })
  saveDocument(useDiagramStore.getState().toDocument())
  return diff
}
