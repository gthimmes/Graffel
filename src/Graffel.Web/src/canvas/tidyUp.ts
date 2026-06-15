// "Tidy up" — run hierarchical auto-layout on the level currently in view and
// apply it as a single undoable step, then fit the result. Shared by the toolbar
// button and the command palette.

import { useDiagramStore } from '../store/diagramStore'
import { layoutLevel, type LayoutEdge, type LayoutNode } from './autoLayout'

export async function tidyUpCurrentLevel(): Promise<boolean> {
  const s = useDiagramStore.getState()
  if (s.readOnly) return false

  const root = s.viewRootId ?? null
  // Only the nodes shown at this level (direct children of the view root) move;
  // their positions are parent-relative, which lines up with ELK's local origin.
  const levelNodes = s.nodes.filter((n) => (n.parentId ?? null) === root)
  if (levelNodes.length < 2) return false

  const ids = new Set(levelNodes.map((n) => n.id))
  const layoutNodes: LayoutNode[] = levelNodes.map((n) => ({ id: n.id, size: n.size }))
  const layoutEdges: LayoutEdge[] = s.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ id: e.id, source: e.source, target: e.target }))

  const positions = await layoutLevel(layoutNodes, layoutEdges)
  if (Object.keys(positions).length === 0) return false

  useDiagramStore.getState().applyLayout(positions)

  // Re-fit the view onto the freshly arranged nodes (no-op outside the canvas).
  const bridge = (window as unknown as { __graffelRf?: { fitView?: () => void } }).__graffelRf
  bridge?.fitView?.()
  return true
}
