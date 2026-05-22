import { create } from 'zustand'
import { ulid } from 'ulid'
import {
  createEmptyDocument,
} from '../format/graffelFile'
import type {
  EdgeType,
  GraffelDocument,
  GraffelEdge,
  GraffelNode,
  HandleSide,
  NodeType,
} from '../format/types'

const DEFAULT_SIZES: Record<NodeType, { w: number; h: number }> = {
  rectangle: { w: 160, h: 80 },
  ellipse:   { w: 160, h: 80 },
  diamond:   { w: 140, h: 100 },
  text:      { w: 160, h: 40 },
  service:   { w: 160, h: 80 },
  database:  { w: 120, h: 90 },
  queue:     { w: 160, h: 60 },
  boundary:  { w: 320, h: 200 },
}

const DEFAULT_LABELS: Record<NodeType, string> = {
  rectangle: 'Rectangle',
  ellipse:   'Ellipse',
  diamond:   'Decision',
  text:      'Text',
  service:   'Service',
  database:  'Database',
  queue:     'Queue',
  boundary:  'Boundary',
}

const HISTORY_LIMIT = 50
const COALESCE_WINDOW_MS = 300

interface HistorySnapshot {
  nodes: GraffelNode[]
  edges: GraffelEdge[]
  title: string
  documentId: string
}

interface DiagramState {
  nodes: GraffelNode[]
  edges: GraffelEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  documentId: string
  title: string
  /** Drive file id this diagram is bound to, if it's been saved to Drive. */
  driveFileId: string | null
  /** When true (v2.2 shared view), mutating actions are silently no-op. */
  readOnly: boolean

  // History (private — _underscored to mark internal state)
  _past: HistorySnapshot[]
  _future: HistorySnapshot[]
  _lastCoalesceKey: string | null
  _lastCoalesceAt: number

  addNode: (type: NodeType, position: { x: number; y: number }) => string
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  updateNodeSize: (id: string, size: { w: number; h: number }) => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeStyle: (id: string, patch: Record<string, unknown>) => void
  duplicateNodes: (ids: string[], offset?: { x: number; y: number }) => string[]
  nudgeNodes: (ids: string[], delta: { x: number; y: number }) => void
  updateEdgeLabel: (id: string, label: string) => void
  updateEdgeStyle: (id: string, patch: Record<string, unknown>) => void
  updateEdgeType: (id: string, type: EdgeType) => void
  addEdgeWaypoint: (id: string, point: { x: number; y: number }, index?: number) => void
  moveEdgeWaypoint: (id: string, index: number, point: { x: number; y: number }) => void
  removeEdgeWaypoint: (id: string, index: number) => void
  clearEdgeWaypoints: (id: string) => void
  addEdge: (
    source: string,
    target: string,
    opts: { sourceHandle: HandleSide; targetHandle: HandleSide; type?: EdgeType },
  ) => string | null
  selectNodes: (ids: string[]) => void
  selectEdges: (ids: string[]) => void
  selectAll: () => void
  removeSelection: () => void
  setTitle: (title: string) => void
  setDriveFileId: (id: string | null) => void
  setReadOnly: (value: boolean) => void

  // History API
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  toDocument: () => GraffelDocument
  loadDocument: (doc: GraffelDocument) => void
  reset: () => void
}

function emptyState(): Pick<DiagramState,
  | 'nodes' | 'edges' | 'selectedNodeIds' | 'selectedEdgeIds'
  | 'documentId' | 'title' | 'driveFileId' | 'readOnly'
  | '_past' | '_future' | '_lastCoalesceKey' | '_lastCoalesceAt'
> {
  const doc = createEmptyDocument()
  return {
    nodes: [],
    edges: [],
    selectedNodeIds: [],
    selectedEdgeIds: [],
    documentId: doc.id,
    title: doc.metadata.title,
    driveFileId: null,
    readOnly: false,
    _past: [],
    _future: [],
    _lastCoalesceKey: null,
    _lastCoalesceAt: 0,
  }
}

export const useDiagramStore = create<DiagramState>((set, get) => {
  function snapshot(coalesceKey: string | null = null) {
    const now = Date.now()
    set((s) => {
      const shouldCoalesce =
        coalesceKey !== null &&
        s._lastCoalesceKey === coalesceKey &&
        now - s._lastCoalesceAt < COALESCE_WINDOW_MS &&
        s._past.length > 0
      if (shouldCoalesce) {
        return { ...s, _future: [], _lastCoalesceAt: now }
      }
      const snap: HistorySnapshot = {
        nodes: s.nodes,
        edges: s.edges,
        title: s.title,
        documentId: s.documentId,
      }
      const past = [...s._past, snap]
      const trimmed = past.length > HISTORY_LIMIT ? past.slice(-HISTORY_LIMIT) : past
      return {
        ...s,
        _past: trimmed,
        _future: [],
        _lastCoalesceKey: coalesceKey,
        _lastCoalesceAt: now,
      }
    })
  }

  return {
    ...emptyState(),

    addNode(type, position) {
      const id = `n_${ulid()}`
      const node: GraffelNode = {
        id,
        type,
        position,
        size: { ...DEFAULT_SIZES[type] },
        data: { label: DEFAULT_LABELS[type] },
      }
      snapshot(null)
      set((s) => ({ nodes: [...s.nodes, node] }))
      return id
    },

    updateNodePosition(id, position) {
      snapshot(`move:${id}`)
      set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
      }))
    },

    updateNodeSize(id, size) {
      snapshot(`resize:${id}`)
      set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, size: { ...size } } : n)),
      }))
    },

    updateNodeLabel(id, label) {
      snapshot(`label:${id}`)
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label } } : n,
        ),
      }))
    },

    updateNodeStyle(id, patch) {
      const key = `style:${id}:${Object.keys(patch).sort().join(',')}`
      snapshot(key)
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, style: { ...(n.data.style ?? {}), ...patch } } }
            : n,
        ),
      }))
    },

    duplicateNodes(ids, offset = { x: 20, y: 20 }) {
      if (ids.length === 0) return []
      snapshot(null)
      const newIds: string[] = []
      set((s) => {
        const toClone = s.nodes.filter((n) => ids.includes(n.id))
        const clones = toClone.map((src) => {
          const newId = `n_${ulid()}`
          newIds.push(newId)
          return {
            ...src,
            id: newId,
            position: { x: src.position.x + offset.x, y: src.position.y + offset.y },
            data: { ...src.data, style: src.data.style ? { ...src.data.style } : undefined },
          }
        })
        return { nodes: [...s.nodes, ...clones], selectedNodeIds: newIds }
      })
      return newIds
    },

    nudgeNodes(ids, delta) {
      if (ids.length === 0) return
      const key = `nudge:${ids.slice().sort().join(',')}`
      snapshot(key)
      set((s) => ({
        nodes: s.nodes.map((n) =>
          ids.includes(n.id)
            ? { ...n, position: { x: n.position.x + delta.x, y: n.position.y + delta.y } }
            : n,
        ),
      }))
    },

    updateEdgeLabel(id, label) {
      snapshot(`elabel:${id}`)
      set((s) => ({
        edges: s.edges.map((e) =>
          e.id === id ? { ...e, data: { ...e.data, label } } : e,
        ),
      }))
    },

    updateEdgeStyle(id, patch) {
      const key = `estyle:${id}:${Object.keys(patch).sort().join(',')}`
      snapshot(key)
      set((s) => ({
        edges: s.edges.map((e) =>
          e.id === id
            ? { ...e, data: { ...e.data, style: { ...(e.data.style ?? {}), ...patch } } }
            : e,
        ),
      }))
    },

    updateEdgeType(id, type) {
      snapshot(null)
      set((s) => ({
        edges: s.edges.map((e) => (e.id === id ? { ...e, type } : e)),
      }))
    },

    addEdgeWaypoint(id, point, index) {
      snapshot(null)
      set((s) => ({
        edges: s.edges.map((e) => {
          if (e.id !== id) return e
          const current = ((e.data as { waypoints?: Array<{ x: number; y: number }> }).waypoints ?? [])
          const next = [...current]
          const at = index === undefined || index > next.length ? next.length : Math.max(0, index)
          next.splice(at, 0, { ...point })
          return { ...e, data: { ...e.data, waypoints: next } }
        }),
      }))
    },

    moveEdgeWaypoint(id, index, point) {
      snapshot(`mw:${id}:${index}`)
      set((s) => ({
        edges: s.edges.map((e) => {
          if (e.id !== id) return e
          const current = ((e.data as { waypoints?: Array<{ x: number; y: number }> }).waypoints ?? [])
          if (index < 0 || index >= current.length) return e
          const next = current.map((p, i) => (i === index ? { ...point } : p))
          return { ...e, data: { ...e.data, waypoints: next } }
        }),
      }))
    },

    removeEdgeWaypoint(id, index) {
      snapshot(null)
      set((s) => ({
        edges: s.edges.map((e) => {
          if (e.id !== id) return e
          const current = ((e.data as { waypoints?: Array<{ x: number; y: number }> }).waypoints ?? [])
          if (index < 0 || index >= current.length) return e
          const next = current.filter((_, i) => i !== index)
          return { ...e, data: { ...e.data, waypoints: next } }
        }),
      }))
    },

    clearEdgeWaypoints(id) {
      snapshot(null)
      set((s) => ({
        edges: s.edges.map((e) =>
          e.id === id ? { ...e, data: { ...e.data, waypoints: [] } } : e,
        ),
      }))
    },

    addEdge(source, target, opts) {
      if (source === target) return null
      const id = `e_${ulid()}`
      const edge: GraffelEdge = {
        id,
        source,
        target,
        sourceHandle: opts.sourceHandle,
        targetHandle: opts.targetHandle,
        type: opts.type ?? 'orthogonal',
        data: { label: '' },
      }
      snapshot(null)
      set((s) => ({ edges: [...s.edges, edge] }))
      return id
    },

    selectNodes(ids) { set({ selectedNodeIds: ids }) },
    selectEdges(ids) { set({ selectedEdgeIds: ids }) },
    selectAll() {
      const s = get()
      set({
        selectedNodeIds: s.nodes.map((n) => n.id),
        selectedEdgeIds: s.edges.map((e) => e.id),
      })
    },

    removeSelection() {
      const { selectedNodeIds, selectedEdgeIds } = get()
      if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return
      snapshot(null)
      set((s) => {
        const killedNodes = new Set(selectedNodeIds)
        const killedEdges = new Set(selectedEdgeIds)
        const remainingNodes = s.nodes.filter((n) => !killedNodes.has(n.id))
        const remainingEdges = s.edges
          .filter((e) => !killedEdges.has(e.id))
          .filter((e) => !killedNodes.has(e.source) && !killedNodes.has(e.target))
        return {
          nodes: remainingNodes,
          edges: remainingEdges,
          selectedNodeIds: [],
          selectedEdgeIds: [],
        }
      })
    },

    setTitle(title) {
      snapshot('title')
      set({ title })
    },

    setDriveFileId(id) { set({ driveFileId: id }) },
    setReadOnly(value) { set({ readOnly: value }) },

    undo() {
      const s = get()
      if (s._past.length === 0) return
      const prev = s._past[s._past.length - 1]!
      const currentSnap: HistorySnapshot = {
        nodes: s.nodes,
        edges: s.edges,
        title: s.title,
        documentId: s.documentId,
      }
      set({
        nodes: prev.nodes,
        edges: prev.edges,
        title: prev.title,
        documentId: prev.documentId,
        _past: s._past.slice(0, -1),
        _future: [...s._future, currentSnap],
        _lastCoalesceKey: null,
        _lastCoalesceAt: 0,
        selectedNodeIds: [],
        selectedEdgeIds: [],
      })
    },

    redo() {
      const s = get()
      if (s._future.length === 0) return
      const next = s._future[s._future.length - 1]!
      const currentSnap: HistorySnapshot = {
        nodes: s.nodes,
        edges: s.edges,
        title: s.title,
        documentId: s.documentId,
      }
      set({
        nodes: next.nodes,
        edges: next.edges,
        title: next.title,
        documentId: next.documentId,
        _past: [...s._past, currentSnap],
        _future: s._future.slice(0, -1),
        _lastCoalesceKey: null,
        _lastCoalesceAt: 0,
        selectedNodeIds: [],
        selectedEdgeIds: [],
      })
    },

    canUndo() { return get()._past.length > 0 },
    canRedo() { return get()._future.length > 0 },

    toDocument() {
      const s = get()
      const doc = createEmptyDocument()
      doc.id = s.documentId
      doc.metadata.title = s.title
      doc.metadata.updatedAt = new Date().toISOString()
      doc.nodes = s.nodes
      doc.edges = s.edges
      // Persist Drive binding in the reserved.remote slot per ADR-0002.
      doc.reserved = {
        ...doc.reserved,
        remote: s.driveFileId ? { driveFileId: s.driveFileId } : null,
      }
      return doc
    },

    loadDocument(doc) {
      const remote = (doc.reserved as { remote?: { driveFileId?: string } | null } | undefined)?.remote
      set({
        nodes: doc.nodes,
        edges: doc.edges,
        documentId: doc.id,
        title: doc.metadata.title,
        driveFileId: remote?.driveFileId ?? null,
        selectedNodeIds: [],
        selectedEdgeIds: [],
        _past: [],
        _future: [],
        _lastCoalesceKey: null,
        _lastCoalesceAt: 0,
      })
    },

    reset() { set(emptyState()) },
  }
})

// Expose the store on `window` for Playwright tests so they can drive
// selection and other state changes without fighting React Flow's pointer
// hit-testing. Harmless in production; just a window assignment.
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__graffel = { useDiagramStore }
}
