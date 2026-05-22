import { useEffect } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import type { EdgeType } from '../format/types'

export interface EdgeContextMenuProps {
  edgeId: string
  x: number
  y: number
  onClose: () => void
}

export function EdgeContextMenu({ edgeId, x, y, onClose }: EdgeContextMenuProps) {
  const updateEdgeType = useDiagramStore((s) => s.updateEdgeType)
  const clearEdgeWaypoints = useDiagramStore((s) => s.clearEdgeWaypoints)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('.graffel-edge-context-menu')) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    // Defer registration so the click that opened us doesn't immediately close it.
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

  function applyType(type: EdgeType) {
    clearEdgeWaypoints(edgeId)
    updateEdgeType(edgeId, type)
    onClose()
  }

  function clearCorners() {
    clearEdgeWaypoints(edgeId)
    onClose()
  }

  return (
    <div
      className="graffel-edge-context-menu"
      style={{ position: 'fixed', left: x, top: y, zIndex: 2000 }}
      role="menu"
      data-testid="edge-context-menu"
    >
      <button type="button" role="menuitem" onClick={() => applyType('orthogonal')} data-testid="edge-ctx-orthogonal">
        Make right-angle
      </button>
      <button type="button" role="menuitem" onClick={() => applyType('straight')} data-testid="edge-ctx-straight">
        Make straight
      </button>
      <button type="button" role="menuitem" onClick={() => applyType('bezier')} data-testid="edge-ctx-curved">
        Make curved
      </button>
      <div className="edge-ctx-divider" />
      <button type="button" role="menuitem" onClick={clearCorners} data-testid="edge-ctx-clear">
        Clear corners
      </button>
    </div>
  )
}
