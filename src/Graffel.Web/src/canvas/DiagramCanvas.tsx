import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import {
  loadFromLocalStorage,
  loadSnapGrid,
  saveSnapGrid,
  saveToLocalStorage,
} from '../store/persistence'
import { isHandleSide, toReactFlowEdge, toReactFlowNode } from './adapters'
import {
  absoluteRect,
  descendantIds,
  indexNodes,
  innermostContainerAt,
  sortNodesByDepth,
} from './nesting'
import { getShape, resolveIsContainer } from '../shapes/registry'
import type { GraffelNode } from '../format/types'
import { ShapeNode } from './ShapeNode'
import { WaypointEdge } from './WaypointEdge'
import { EdgeContextMenu } from './EdgeContextMenu'
import { useEdgeMenuStore } from './edgeMenuStore'
import { EdgeMarkerDefs } from './EdgeMarkers'
import { useUiStore } from '../ui/CommandPalette'
import { AlignmentGuides } from './AlignmentGuides'
import { computeSnap, GRID_SIZE, type Guide, type IdRect } from './snap'

const nodeTypes = { shape: ShapeNode }
const edgeTypes = { waypoint: WaypointEdge }

export function DiagramCanvas() {
  const nodes = useDiagramStore((s) => s.nodes)
  const edges = useDiagramStore((s) => s.edges)
  const addNode = useDiagramStore((s) => s.addNode)
  const updateNodePosition = useDiagramStore((s) => s.updateNodePosition)
  const addEdge = useDiagramStore((s) => s.addEdge)
  const selectNodes = useDiagramStore((s) => s.selectNodes)
  const selectEdges = useDiagramStore((s) => s.selectEdges)
  const removeSelection = useDiagramStore((s) => s.removeSelection)
  const loadDocument = useDiagramStore((s) => s.loadDocument)
  const toDocument = useDiagramStore((s) => s.toDocument)

  const selectedNodeIds = useDiagramStore((s) => s.selectedNodeIds)
  const selectedEdgeIds = useDiagramStore((s) => s.selectedEdgeIds)
  const readOnly = useDiagramStore((s) => s.readOnly)
  const edgeMenu = useEdgeMenuStore((s) => s.open)
  const closeEdgeMenu = useEdgeMenuStore((s) => s.close)

  const rfNodes = useMemo(
    // Parents must precede their children in the array (React Flow requirement).
    () => sortNodesByDepth(nodes).map((n) => ({
      ...toReactFlowNode(n),
      selected: selectedNodeIds.includes(n.id),
    })),
    [nodes, selectedNodeIds],
  )
  const rfEdges = useMemo(
    () => edges.map((e) => ({
      ...toReactFlowEdge(e),
      selected: selectedEdgeIds.includes(e.id),
    })),
    [edges, selectedEdgeIds],
  )

  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const selectAll = useDiagramStore((s) => s.selectAll)
  const duplicateNodes = useDiagramStore((s) => s.duplicateNodes)
  const nudgeNodes = useDiagramStore((s) => s.nudgeNodes)
  const groupNodes = useDiagramStore((s) => s.groupNodes)
  const ungroupNodes = useDiagramStore((s) => s.ungroupNodes)
  const setNodeParent = useDiagramStore((s) => s.setNodeParent)

  const rf = useReactFlow()
  const { screenToFlowPosition } = rf
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Expose flow↔screen helpers to Playwright so E2E can compute precise
  // drag targets regardless of zoom/translate.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>).__graffelRf = {
        getViewport: () => rf.getViewport(),
        flowToScreen: (p: { x: number; y: number }) => {
          const v = rf.getViewport()
          // Map a flow point to a viewport-local position; the test layers on
          // the canvas-host's screen offset.
          return { x: p.x * v.zoom + v.x, y: p.y * v.zoom + v.y }
        },
      }
    }
  }, [rf])
  // Track the latest cursor position in flow coordinates for keyboard quick-insert.
  const lastCursorFlow = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // v3.9 alignment guides — ephemeral, only during a drag.
  const [activeGuides, setActiveGuides] = useState<Guide[]>([])
  // Expose the live count to window so Playwright can introspect.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>).__graffelGuides = activeGuides
    }
  }, [activeGuides])
  // Track Alt key for snap-disable during a drag.
  const altDownRef = useRef(false)
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { if (e.key === 'Alt') altDownRef.current = true }
    const onUp   = (e: KeyboardEvent) => { if (e.key === 'Alt') altDownRef.current = false }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const doc = loadFromLocalStorage()
    if (doc) loadDocument(doc)
    useDiagramStore.getState().setSnapGrid(loadSnapGrid())
  }, [loadDocument])

  // Autosave on store changes (debounced).
  useEffect(() => {
    const t = window.setTimeout(() => {
      saveToLocalStorage(toDocument())
    }, 400)
    return () => window.clearTimeout(t)
  }, [nodes, edges, toDocument])

  // Persist the grid-snap preference whenever it changes.
  const snapGrid = useDiagramStore((s) => s.snapGrid)
  useEffect(() => { saveSnapGrid(snapGrid) }, [snapGrid])

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    let nextGuides: Guide[] | null = null
    let stillDragging = false
    for (const change of changes as NodeChange[]) {
      if (change.type === 'position' && change.position) {
        const state = useDiagramStore.getState()
        const dragged = state.nodes.find((n) => n.id === change.id)
        // Nested children move in parent-relative coords; the snap/guide math
        // assumes absolute coords, so skip it for them and write through as-is.
        if (dragged && (dragged.parentId ?? null) === null) {
          const others: IdRect[] = state.nodes
            .filter((n) => n.id !== change.id)
            .map((n) => ({
              id: n.id,
              x: n.position.x,
              y: n.position.y,
              w: n.size.w,
              h: n.size.h,
            }))
          const snapped = computeSnap({
            draggedRect: {
              x: change.position.x,
              y: change.position.y,
              w: dragged.size.w,
              h: dragged.size.h,
            },
            otherRects: others,
            gridSize: state.snapGrid ? GRID_SIZE : null,
            disabled: altDownRef.current,
          })
          change.position = snapped.position
          if (change.dragging) {
            nextGuides = snapped.guides
            stillDragging = true
          }
        }
        updateNodePosition(change.id, change.position)
      } else if (change.type === 'select') {
        const current = useDiagramStore.getState().selectedNodeIds
        const next = change.selected
          ? Array.from(new Set([...current, change.id]))
          : current.filter((id) => id !== change.id)
        selectNodes(next)
      } else if (change.type === 'remove') {
        selectNodes([change.id])
        removeSelection()
      }
    }
    // Show guides only while dragging; clear on drop or any non-drag change.
    if (stillDragging && nextGuides) {
      setActiveGuides(nextGuides)
    } else if (changes.some((c) => c.type === 'position' && !c.dragging)) {
      setActiveGuides([])
    }
  }, [updateNodePosition, selectNodes, removeSelection])

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    for (const change of changes as EdgeChange[]) {
      if (change.type === 'select') {
        const current = useDiagramStore.getState().selectedEdgeIds
        const next = change.selected
          ? Array.from(new Set([...current, change.id]))
          : current.filter((id) => id !== change.id)
        selectEdges(next)
      } else if (change.type === 'remove') {
        selectEdges([change.id])
        removeSelection()
      }
    }
  }, [selectEdges, removeSelection])

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection
    if (!source || !target) return
    if (!isHandleSide(sourceHandle) || !isHandleSide(targetHandle)) return
    addEdge(source, target, { sourceHandle, targetHandle })
  }, [addEdge])

  // Drag-into / drag-out: when a node is dropped, nest it in the innermost
  // container under its center, or release it if dropped outside any container.
  const onNodeDragStop = useCallback((_e: React.MouseEvent, node: { id: string }) => {
    const state = useDiagramStore.getState()
    const dragged = state.nodes.find((n) => n.id === node.id)
    if (!dragged) return
    const byId = indexNodes(state.nodes)
    const rect = absoluteRect(dragged, byId)
    const exclude = new Set<string>([dragged.id, ...descendantIds(dragged.id, state.nodes)])
    const isContainer = (n: GraffelNode) => resolveIsContainer(getShape(n.type))
    const target = innermostContainerAt(rect, state.nodes, byId, { isContainer, excludeIds: exclude })
    const targetId = target?.id ?? null
    if (targetId !== (dragged.parentId ?? null)) {
      setNodeParent(dragged.id, targetId)
    }
  }, [setNodeParent])

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const shapeId = event.dataTransfer.getData('application/graffel-shape-id')
    if (!shapeId) return
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })
    addNode(shapeId, position)
  }, [addNode, screenToFlowPosition])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Track cursor in flow coordinates for keyboard quick-insert.
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    lastCursorFlow.current = screenToFlowPosition({ x: e.clientX, y: e.clientY })
  }, [screenToFlowPosition])

  // Keyboard shortcuts.
  useEffect(() => {
    const QUICK_INSERT: Record<string, string> = {
      r: 'basic:rectangle', e: 'basic:ellipse', d: 'basic:diamond', t: 'basic:text',
    }
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const inEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      const mod = e.metaKey || e.ctrlKey

      // Undo / Redo — works even when palette/inspector inputs are not focused.
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        if (inEditable) return
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && (e.key === 'y' || e.key === 'Y')) {
        if (inEditable) return
        e.preventDefault()
        redo()
        return
      }

      if (inEditable) return

      // Open command palette.
      if (e.key === '/' && !mod && !e.altKey) {
        e.preventDefault()
        useUiStore.getState().openPalette()
        return
      }

      // Select all.
      if (mod && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        selectAll()
        return
      }

      // Toggle grid snap (Cmd/Ctrl+;).
      if (mod && e.key === ';') {
        e.preventDefault()
        const s = useDiagramStore.getState()
        s.setSnapGrid(!s.snapGrid)
        return
      }

      // Duplicate.
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        const ids = useDiagramStore.getState().selectedNodeIds
        if (ids.length > 0) duplicateNodes(ids)
        return
      }

      // Group (Cmd/Ctrl+G) / Ungroup (Cmd/Ctrl+Shift+G).
      if (mod && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault()
        const st = useDiagramStore.getState()
        if (e.shiftKey) {
          // Ungroup every selected container.
          for (const id of st.selectedNodeIds) {
            const node = st.nodes.find((n) => n.id === id)
            if (node && resolveIsContainer(getShape(node.type))) ungroupNodes(id)
          }
        } else {
          // Group needs at least two top-level nodes.
          const topLevel = st.selectedNodeIds.filter((id) => {
            const n = st.nodes.find((x) => x.id === id)
            return n && (n.parentId ?? null) === null
          })
          if (topLevel.length >= 2) groupNodes(topLevel)
        }
        return
      }

      // Delete / Escape.
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const s = useDiagramStore.getState()
        if (s.selectedNodeIds.length > 0 || s.selectedEdgeIds.length > 0) {
          e.preventDefault()
          removeSelection()
        }
        return
      }
      if (e.key === 'Escape') {
        selectNodes([])
        selectEdges([])
        return
      }

      // Type-to-edit: with exactly one node selected, a printable key opens its
      // label editor and replaces the text; Enter/F2 edits the existing label.
      // Runs before quick-insert so typing on a selected shape edits it rather
      // than inserting a new shape.
      {
        const st = useDiagramStore.getState()
        if (st.selectedNodeIds.length === 1 && st.editingNodeId === null) {
          const nodeId = st.selectedNodeIds[0]!
          if (e.key === 'Enter' || e.key === 'F2') {
            e.preventDefault()
            st.beginEditNode(nodeId)
            return
          }
          if (e.key.length === 1 && !mod && !e.altKey) {
            e.preventDefault()
            st.beginEditNode(nodeId, e.key)
            return
          }
        }
      }

      // Arrow nudge.
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const ids = useDiagramStore.getState().selectedNodeIds
        if (ids.length === 0) return
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
        e.preventDefault()
        nudgeNodes(ids, { x: dx, y: dy })
        return
      }

      // Quick-insert R / E / D / T at cursor flow position.
      // (Note: Cmd+D is handled above as duplicate; bare 'd' inserts a diamond.)
      const lower = e.key.toLowerCase()
      if (!mod && !e.altKey && QUICK_INSERT[lower]) {
        e.preventDefault()
        useDiagramStore.getState().addNode(
          QUICK_INSERT[lower]!,
          { ...lastCursorFlow.current },
        )
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [removeSelection, selectNodes, selectEdges, undo, redo, selectAll, duplicateNodes, nudgeNodes, groupNodes, ungroupNodes])

  return (
    <div
      ref={wrapperRef}
      className="graffel-canvas-host"
      data-testid="canvas-host"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onMouseMove={onMouseMove}
    >
      <EdgeMarkerDefs />
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onNodeDragStop={readOnly ? undefined : onNodeDragStop}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
        <AlignmentGuides guides={activeGuides} />
      </ReactFlow>
      {edgeMenu ? (
        <EdgeContextMenu
          edgeId={edgeMenu.edgeId}
          x={edgeMenu.x}
          y={edgeMenu.y}
          onClose={closeEdgeMenu}
        />
      ) : null}
    </div>
  )
}
