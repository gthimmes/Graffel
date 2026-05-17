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
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import {
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../store/persistence'
import { isHandleSide, toReactFlowEdge, toReactFlowNode } from './adapters'
import { ShapeNode } from './ShapeNode'
import { WaypointEdge } from './WaypointEdge'
import { useUiStore } from '../ui/CommandPalette'
import type { NodeType } from '../format/types'

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

  const rfNodes = useMemo(
    () => nodes.map((n) => ({
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

  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Track the latest cursor position in flow coordinates for keyboard quick-insert.
  const lastCursorFlow = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const doc = loadFromLocalStorage()
    if (doc) loadDocument(doc)
  }, [loadDocument])

  // Autosave on store changes (debounced).
  useEffect(() => {
    const t = window.setTimeout(() => {
      saveToLocalStorage(toDocument())
    }, 400)
    return () => window.clearTimeout(t)
  }, [nodes, edges, toDocument])

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    for (const change of changes as NodeChange[]) {
      if (change.type === 'position' && change.position && !change.dragging) {
        updateNodePosition(change.id, change.position)
      } else if (change.type === 'position' && change.position) {
        // live drag — still update so save reflects current
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

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/graffel-node-type') as NodeType
    if (!type) return
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })
    addNode(type, position)
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
    const QUICK_INSERT: Record<string, NodeType> = {
      r: 'rectangle', e: 'ellipse', d: 'diamond', t: 'text',
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

      // Duplicate.
      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        const ids = useDiagramStore.getState().selectedNodeIds
        if (ids.length > 0) duplicateNodes(ids)
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
          QUICK_INSERT[lower] as NodeType,
          { ...lastCursorFlow.current },
        )
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [removeSelection, selectNodes, selectEdges, undo, redo, selectAll, duplicateNodes, nudgeNodes])

  return (
    <div
      ref={wrapperRef}
      className="graffel-canvas-host"
      data-testid="canvas-host"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onMouseMove={onMouseMove}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}
