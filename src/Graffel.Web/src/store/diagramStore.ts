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

interface DiagramState {
  nodes: GraffelNode[]
  edges: GraffelEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  documentId: string
  title: string

  addNode: (type: NodeType, position: { x: number; y: number }) => string
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  updateNodeLabel: (id: string, label: string) => void
  updateEdgeLabel: (id: string, label: string) => void
  addEdge: (
    source: string,
    target: string,
    opts: { sourceHandle: HandleSide; targetHandle: HandleSide; type?: EdgeType },
  ) => string | null
  selectNodes: (ids: string[]) => void
  selectEdges: (ids: string[]) => void
  removeSelection: () => void
  setTitle: (title: string) => void

  toDocument: () => GraffelDocument
  loadDocument: (doc: GraffelDocument) => void
  reset: () => void
}

function emptyState(): Pick<DiagramState,
  'nodes' | 'edges' | 'selectedNodeIds' | 'selectedEdgeIds' | 'documentId' | 'title'
> {
  const doc = createEmptyDocument()
  return {
    nodes: [],
    edges: [],
    selectedNodeIds: [],
    selectedEdgeIds: [],
    documentId: doc.id,
    title: doc.metadata.title,
  }
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
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
    set((s) => ({ nodes: [...s.nodes, node] }))
    return id
  },

  updateNodePosition(id, position) {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    }))
  },

  updateNodeLabel(id, label) {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n,
      ),
    }))
  },

  updateEdgeLabel(id, label) {
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, label } } : e,
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
    set((s) => ({ edges: [...s.edges, edge] }))
    return id
  },

  selectNodes(ids) { set({ selectedNodeIds: ids }) },
  selectEdges(ids) { set({ selectedEdgeIds: ids }) },

  removeSelection() {
    const { selectedNodeIds, selectedEdgeIds } = get()
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

  setTitle(title) { set({ title }) },

  toDocument() {
    const s = get()
    const doc = createEmptyDocument()
    doc.id = s.documentId
    doc.metadata.title = s.title
    doc.metadata.updatedAt = new Date().toISOString()
    doc.nodes = s.nodes
    doc.edges = s.edges
    return doc
  },

  loadDocument(doc) {
    set({
      nodes: doc.nodes,
      edges: doc.edges,
      documentId: doc.id,
      title: doc.metadata.title,
      selectedNodeIds: [],
      selectedEdgeIds: [],
    })
  },

  reset() { set(emptyState()) },
}))
