import { useEffect } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { getShape, resolveIsContainer } from '../shapes/registry'

export interface NodeContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

/** Right-click menu for nodes: z-order, duplicate/delete, and group/ungroup.
 *  Acts on the current selection (the opener selects the right-clicked node). */
export function NodeContextMenu({ x, y, onClose }: NodeContextMenuProps) {
  const selectedNodeIds = useDiagramStore((s) => s.selectedNodeIds)
  const nodes = useDiagramStore((s) => s.nodes)
  const bringToFront = useDiagramStore((s) => s.bringToFront)
  const bringForward = useDiagramStore((s) => s.bringForward)
  const sendBackward = useDiagramStore((s) => s.sendBackward)
  const sendToBack = useDiagramStore((s) => s.sendToBack)
  const duplicateNodes = useDiagramStore((s) => s.duplicateNodes)
  const removeSelection = useDiagramStore((s) => s.removeSelection)
  const groupNodes = useDiagramStore((s) => s.groupNodes)
  const ungroupNodes = useDiagramStore((s) => s.ungroupNodes)
  const enterContainer = useDiagramStore((s) => s.enterContainer)
  const toggleCollapsed = useDiagramStore((s) => s.toggleCollapsed)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('.graffel-context-menu')) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    const id = window.setTimeout(() => {
      window.addEventListener('click', onClick)
      window.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const ids = selectedNodeIds
  const run = (fn: () => void) => { fn(); onClose() }

  const topLevel = ids.filter((id) => {
    const n = nodes.find((x) => x.id === id)
    return n && (n.parentId ?? null) === null
  })
  const soleNode = ids.length === 1 ? nodes.find((n) => n.id === ids[0]) : undefined
  const soleContainer = !!soleNode && resolveIsContainer(getShape(soleNode.type))
  const soleCollapsed = soleContainer && (soleNode!.data as { collapsed?: boolean }).collapsed === true

  return (
    <div
      className="graffel-context-menu"
      style={{ position: 'fixed', left: x, top: y, zIndex: 2000 }}
      role="menu"
      data-testid="node-context-menu"
    >
      {soleContainer ? (
        <>
          <button type="button" role="menuitem" onClick={() => run(() => enterContainer(ids[0]!))} data-testid="node-ctx-enter">
            Enter container
          </button>
          <button type="button" role="menuitem" onClick={() => run(() => toggleCollapsed(ids[0]!))} data-testid="node-ctx-collapse">
            {soleCollapsed ? 'Expand contents' : 'Collapse contents'}
          </button>
          <div className="ctx-divider" />
        </>
      ) : null}
      <button type="button" role="menuitem" onClick={() => run(() => bringToFront(ids))} data-testid="node-ctx-front">
        Bring to front
      </button>
      <button type="button" role="menuitem" onClick={() => run(() => bringForward(ids))} data-testid="node-ctx-forward">
        Bring forward
      </button>
      <button type="button" role="menuitem" onClick={() => run(() => sendBackward(ids))} data-testid="node-ctx-backward">
        Send backward
      </button>
      <button type="button" role="menuitem" onClick={() => run(() => sendToBack(ids))} data-testid="node-ctx-back">
        Send to back
      </button>

      {topLevel.length >= 2 || soleContainer ? <div className="ctx-divider" /> : null}
      {topLevel.length >= 2 ? (
        <button type="button" role="menuitem" onClick={() => run(() => groupNodes(topLevel))} data-testid="node-ctx-group">
          Group
        </button>
      ) : null}
      {soleContainer ? (
        <button type="button" role="menuitem" onClick={() => run(() => ungroupNodes(ids[0]!))} data-testid="node-ctx-ungroup">
          Ungroup
        </button>
      ) : null}

      <div className="ctx-divider" />
      <button type="button" role="menuitem" onClick={() => run(() => duplicateNodes(ids))} data-testid="node-ctx-duplicate">
        Duplicate
      </button>
      <button type="button" role="menuitem" onClick={() => run(() => removeSelection())} data-testid="node-ctx-delete">
        Delete
      </button>
    </div>
  )
}
