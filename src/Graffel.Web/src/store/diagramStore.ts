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
} from '../format/types'
import { allShapeIds, getShape, resolveIsContainer } from '../shapes/registry'
import { absolutePosition, absoluteRect, descendantIds, indexNodes } from '../canvas/nesting'
import { isClipboardFragment, materializeFragment, type ClipboardFragment } from '../canvas/clipboard'

const FALLBACK_SIZE = { w: 160, h: 80 }

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
  /** v3.9: grid-snap toggle. False by default; persisted via localStorage hook. */
  snapGrid: boolean
  /** Node whose label is currently being edited inline (ephemeral UI state). */
  editingNodeId: string | null
  /** Seed text for an edit session: a string replaces the label; null selects-all. */
  editSeed: string | null
  /** v3.14 drill-down: the container whose interior the canvas is showing (null = root). */
  viewRootId: string | null

  // History (private — _underscored to mark internal state)
  _past: HistorySnapshot[]
  _future: HistorySnapshot[]
  _lastCoalesceKey: string | null
  _lastCoalesceAt: number

  addNode: (shapeId: string, position: { x: number; y: number }) => string
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  updateNodeSize: (id: string, size: { w: number; h: number }) => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeStyle: (id: string, patch: Record<string, unknown>) => void
  duplicateNodes: (ids: string[], offset?: { x: number; y: number }) => string[]
  nudgeNodes: (ids: string[], delta: { x: number; y: number }) => void
  /** Wrap the top-level nodes among `ids` in a new container; returns its id (null if none). */
  groupNodes: (ids: string[]) => string | null
  /** Dissolve a container, lifting its children one level up (absolute-preserving). */
  ungroupNodes: (groupId: string) => void
  /** Reparent a node into `parentId` (or null to unparent), converting its stored position. */
  setNodeParent: (id: string, parentId: string | null) => void
  /** Z-order: stacking within a depth level follows the nodes-array order (later = on top). */
  bringToFront: (ids: string[]) => void
  sendToBack: (ids: string[]) => void
  bringForward: (ids: string[]) => void
  sendBackward: (ids: string[]) => void
  /** Drill into a container (navigation — allowed in read-only share views). */
  enterContainer: (id: string) => void
  /** Jump to a level: a container id on the current chain, or null for the root. */
  exitToLevel: (id: string | null) => void
  /** Navigate to the level that contains a node and select it (e.g. from a boundary stub). */
  revealNode: (id: string) => void
  /** Collapse/expand a container's contents at its parent level (persisted, undoable). */
  toggleCollapsed: (id: string) => void
  /** Paste a clipboard fragment at a position in the current level; returns new node ids. */
  pasteFragment: (fragment: ClipboardFragment, basePosition: { x: number; y: number }) => string[]
  /** Move an edge endpoint (drag-to-reconnect). Self-loops are refused. */
  updateEdgeConnection: (
    id: string,
    conn: { source: string; sourceHandle: HandleSide; target: string; targetHandle: HandleSide },
  ) => void
  updateEdgeLabel: (id: string, label: string) => void
  updateEdgeStyle: (id: string, patch: Record<string, unknown>) => void
  updateEdgeType: (id: string, type: EdgeType) => void
  addEdgeWaypoint: (id: string, point: { x: number; y: number }, index?: number) => void
  moveEdgeWaypoint: (id: string, index: number, point: { x: number; y: number }) => void
  removeEdgeWaypoint: (id: string, index: number) => void
  clearEdgeWaypoints: (id: string) => void
  /** Set the connector label's position as a fraction (0–1) along its path. */
  setEdgeLabelT: (id: string, t: number) => void
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
  setSnapGrid: (value: boolean) => void
  /** Enter inline label editing for a node. `seed` of a string replaces the
   *  label as the first keystroke; null/undefined edits the existing label (select-all). */
  beginEditNode: (id: string, seed?: string | null) => void
  /** Exit inline label editing. */
  endEditNode: () => void

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
  | 'documentId' | 'title' | 'driveFileId' | 'readOnly' | 'snapGrid'
  | 'editingNodeId' | 'editSeed' | 'viewRootId'
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
    snapGrid: false,
    editingNodeId: null,
    editSeed: null,
    viewRootId: null,
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

    addNode(shapeId, position) {
      const def = getShape(shapeId)
      const id = `n_${ulid()}`
      const node: GraffelNode = {
        id,
        type: shapeId,
        // New shapes land in the level being viewed (drill-down). Positions in a
        // drilled view are already parent-relative, so no conversion is needed.
        parentId: get().viewRootId,
        position,
        size: { ...(def?.defaultSize ?? FALLBACK_SIZE) },
        data: {
          // Shapes start unlabeled; the user types a label when they want one.
          // (The shape's name still drives the palette tooltip + inspector heading.)
          label: '',
          style: def?.defaultStyle ? { ...def.defaultStyle } : undefined,
        },
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
        // Clone the requested nodes AND any descendants (so duplicating a
        // container duplicates its contents).
        const cloneSet = new Set<string>()
        for (const id of ids) {
          if (s.nodes.some((n) => n.id === id)) cloneSet.add(id)
          for (const d of descendantIds(id, s.nodes)) cloneSet.add(d)
        }
        const idMap = new Map<string, string>()
        for (const id of cloneSet) idMap.set(id, `n_${ulid()}`)

        const clones = s.nodes
          .filter((n) => cloneSet.has(n.id))
          .map((src) => {
            const newId = idMap.get(src.id)!
            newIds.push(newId)
            const parentCloned = src.parentId != null && cloneSet.has(src.parentId)
            const newParent = parentCloned ? idMap.get(src.parentId!)! : (src.parentId ?? null)
            // Offset only the roots of the duplicated forest (parent not cloned);
            // nested children keep their parent-relative position so internal
            // layout is preserved.
            const position = parentCloned
              ? { ...src.position }
              : { x: src.position.x + offset.x, y: src.position.y + offset.y }
            return {
              ...src,
              id: newId,
              parentId: newParent,
              position,
              data: { ...src.data, style: src.data.style ? { ...src.data.style } : undefined },
            }
          })
        // Select the cloned versions of the originally-requested nodes.
        const selected = ids.map((id) => idMap.get(id)).filter((x): x is string => !!x)
        return { nodes: [...s.nodes, ...clones], selectedNodeIds: selected }
      })
      return newIds
    },

    groupNodes(ids) {
      const state = get()
      const byId = indexNodes(state.nodes)
      // Only group nodes that exist and are currently top-level.
      const members = ids
        .map((id) => state.nodes.find((n) => n.id === id))
        .filter((n): n is GraffelNode => !!n && (n.parentId ?? null) === null)
      if (members.length === 0) return null

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const n of members) {
        const r = absoluteRect(n, byId)
        minX = Math.min(minX, r.x); minY = Math.min(minY, r.y)
        maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h)
      }
      const PAD = 24
      const gx = minX - PAD, gy = minY - PAD
      const def = getShape('basic:group')
      const gid = `n_${ulid()}`
      const group: GraffelNode = {
        id: gid,
        type: 'basic:group',
        parentId: null,
        position: { x: gx, y: gy },
        size: { w: maxX - minX + 2 * PAD, h: maxY - minY + 2 * PAD },
        data: { label: '', style: def?.defaultStyle ? { ...def.defaultStyle } : undefined },
      }
      const memberIds = new Set(members.map((m) => m.id))
      snapshot(null)
      set((s) => ({
        // Container first so it precedes its children (React Flow ordering).
        nodes: [
          group,
          ...s.nodes.map((n) =>
            memberIds.has(n.id)
              ? { ...n, parentId: gid, position: { x: n.position.x - gx, y: n.position.y - gy } }
              : n,
          ),
        ],
        selectedNodeIds: [gid],
      }))
      return gid
    },

    ungroupNodes(groupId) {
      const state = get()
      const group = state.nodes.find((n) => n.id === groupId)
      if (!group) return
      const newParent = group.parentId ?? null
      const freed: string[] = []
      snapshot(null)
      set((s) => {
        const nodes = s.nodes
          .filter((n) => n.id !== groupId)
          .map((n) => {
            if ((n.parentId ?? null) !== groupId) return n
            freed.push(n.id)
            // Lift one level up: child's new position = child(rel to group) + group(rel to its parent).
            return {
              ...n,
              parentId: newParent,
              position: { x: n.position.x + group.position.x, y: n.position.y + group.position.y },
            }
          })
        return { nodes, selectedNodeIds: freed }
      })
    },

    setNodeParent(id, parentId) {
      const state = get()
      const node = state.nodes.find((n) => n.id === id)
      if (!node) return
      if (parentId === id) return
      if ((node.parentId ?? null) === (parentId ?? null)) return
      const byId = indexNodes(state.nodes)
      if (parentId && !byId.has(parentId)) return
      // Prevent cycles: can't nest a node inside one of its own descendants.
      if (parentId && descendantIds(id, state.nodes).has(parentId)) return
      const abs = absolutePosition(node, byId)
      const parentAbs = parentId ? absolutePosition(byId.get(parentId)!, byId) : { x: 0, y: 0 }
      const newPos = { x: abs.x - parentAbs.x, y: abs.y - parentAbs.y }
      snapshot(null)
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, parentId: parentId ?? null, position: newPos } : n,
        ),
      }))
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

    setEdgeLabelT(id, t) {
      const clamped = Math.max(0, Math.min(1, t))
      snapshot(`elabelt:${id}`)
      set((s) => ({
        edges: s.edges.map((e) =>
          e.id === id ? { ...e, data: { ...e.data, labelT: clamped } } : e,
        ),
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

    bringToFront(ids) {
      if (ids.length === 0) return
      const sel = new Set(ids)
      snapshot(null)
      set((s) => ({
        nodes: [...s.nodes.filter((n) => !sel.has(n.id)), ...s.nodes.filter((n) => sel.has(n.id))],
      }))
    },

    sendToBack(ids) {
      if (ids.length === 0) return
      const sel = new Set(ids)
      snapshot(null)
      set((s) => ({
        nodes: [...s.nodes.filter((n) => sel.has(n.id)), ...s.nodes.filter((n) => !sel.has(n.id))],
      }))
    },

    bringForward(ids) {
      if (ids.length === 0) return
      const sel = new Set(ids)
      snapshot(null)
      set((s) => {
        const arr = [...s.nodes]
        // Walk top→down so a moved node isn't carried further in the same pass.
        for (let i = arr.length - 2; i >= 0; i--) {
          if (sel.has(arr[i]!.id) && !sel.has(arr[i + 1]!.id)) {
            ;[arr[i], arr[i + 1]] = [arr[i + 1]!, arr[i]!]
          }
        }
        return { nodes: arr }
      })
    },

    sendBackward(ids) {
      if (ids.length === 0) return
      const sel = new Set(ids)
      snapshot(null)
      set((s) => {
        const arr = [...s.nodes]
        for (let i = 1; i < arr.length; i++) {
          if (sel.has(arr[i]!.id) && !sel.has(arr[i - 1]!.id)) {
            ;[arr[i], arr[i - 1]] = [arr[i - 1]!, arr[i]!]
          }
        }
        return { nodes: arr }
      })
    },

    enterContainer(id) {
      const node = get().nodes.find((n) => n.id === id)
      if (!node || !resolveIsContainer(getShape(node.type))) return
      // Navigation, not mutation — deliberately allowed in read-only share views.
      set({ viewRootId: id, selectedNodeIds: [], selectedEdgeIds: [], editingNodeId: null, editSeed: null })
    },

    exitToLevel(id) {
      if (id !== null && !get().nodes.some((n) => n.id === id)) return
      set({ viewRootId: id, selectedNodeIds: [], selectedEdgeIds: [] })
    },

    revealNode(id) {
      const node = get().nodes.find((n) => n.id === id)
      if (!node) return
      // Navigation (allowed read-only): surface the level holding the node.
      set({ viewRootId: node.parentId ?? null, selectedNodeIds: [id], selectedEdgeIds: [] })
    },

    toggleCollapsed(id) {
      if (get().readOnly) return
      const node = get().nodes.find((n) => n.id === id)
      if (!node) return
      snapshot(null)
      set((s) => ({
        nodes: s.nodes.map((n) => {
          if (n.id !== id) return n
          const data = { ...n.data } as { collapsed?: boolean } & typeof n.data
          if (data.collapsed) delete data.collapsed
          else data.collapsed = true
          return { ...n, data }
        }),
      }))
    },

    pasteFragment(fragment, basePosition) {
      const s = get()
      if (s.readOnly) return []
      if (!isClipboardFragment(fragment) || fragment.nodes.length === 0) return []
      const { nodes, edges } = materializeFragment(fragment, {
        idFor: (old) => `${old.startsWith('e') ? 'e' : 'n'}_${ulid()}`,
        basePosition,
        parentId: s.viewRootId,
      })
      snapshot(null)
      const rootIds = nodes
        .filter((n) => (n.parentId ?? null) === s.viewRootId)
        .map((n) => n.id)
      set((st) => ({
        nodes: [...st.nodes, ...nodes],
        edges: [...st.edges, ...edges],
        selectedNodeIds: rootIds,
        selectedEdgeIds: [],
      }))
      return rootIds
    },

    updateEdgeConnection(id, conn) {
      if (conn.source === conn.target) return
      const s = get()
      if (!s.nodes.some((n) => n.id === conn.source) || !s.nodes.some((n) => n.id === conn.target)) return
      snapshot(null)
      set((st) => ({
        edges: st.edges.map((e) =>
          e.id === id
            ? {
                ...e,
                source: conn.source,
                sourceHandle: conn.sourceHandle,
                target: conn.target,
                targetHandle: conn.targetHandle,
              }
            : e,
        ),
      }))
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
        // Deleting a container takes its contents (undo restores).
        for (const id of selectedNodeIds) {
          for (const d of descendantIds(id, s.nodes)) killedNodes.add(d)
        }
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
          editingNodeId: s.editingNodeId && killedNodes.has(s.editingNodeId) ? null : s.editingNodeId,
          editSeed: s.editingNodeId && killedNodes.has(s.editingNodeId) ? null : s.editSeed,
        }
      })
    },

    setTitle(title) {
      snapshot('title')
      set({ title })
    },

    setDriveFileId(id) { set({ driveFileId: id }) },
    setReadOnly(value) { set({ readOnly: value }) },
    setSnapGrid(value) { set({ snapGrid: value }) },

    beginEditNode(id, seed = null) {
      if (get().readOnly) return
      set({ editingNodeId: id, editSeed: seed })
    },
    endEditNode() { set({ editingNodeId: null, editSeed: null }) },

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
        // If the level we were inside no longer exists, surface back to the root.
        viewRootId: s.viewRootId && prev.nodes.some((n) => n.id === s.viewRootId) ? s.viewRootId : null,
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
        viewRootId: s.viewRootId && next.nodes.some((n) => n.id === s.viewRootId) ? s.viewRootId : null,
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
        editingNodeId: null,
        editSeed: null,
        viewRootId: null,
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
  ;(window as unknown as Record<string, unknown>).__graffel = { useDiagramStore, allShapeIds }
}
