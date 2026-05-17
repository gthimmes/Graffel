import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type NodeChange,
  type OnConnect,
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
import type { NodeType } from '../format/types'

const nodeTypes = { shape: ShapeNode }

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
  const setTitle = useDiagramStore((s) => s.setTitle)

  const rfNodes = useMemo(() => nodes.map(toReactFlowNode), [nodes])
  const rfEdges = useMemo(() => edges.map(toReactFlowEdge), [edges])

  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  // Keyboard: Delete / Backspace removes selection; Escape clears selection.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const inEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if (inEditable) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const s = useDiagramStore.getState()
        if (s.selectedNodeIds.length > 0 || s.selectedEdgeIds.length > 0) {
          e.preventDefault()
          removeSelection()
        }
      } else if (e.key === 'Escape') {
        selectNodes([])
        selectEdges([])
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        // command palette stub — focus the title for now (extension point)
        const input = document.querySelector<HTMLInputElement>('.title-input')
        input?.focus()
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [removeSelection, selectNodes, selectEdges, setTitle])

  return (
    <div
      ref={wrapperRef}
      className="graffel-canvas-host"
      data-testid="canvas-host"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
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
