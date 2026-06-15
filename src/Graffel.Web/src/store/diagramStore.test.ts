import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'
import { buildFragment } from '../canvas/clipboard'
import type { NodeType } from '../format/types'

function reset() {
  useDiagramStore.getState().reset()
}

describe('diagramStore', () => {
  beforeEach(reset)

  describe('addNode', () => {
    it('adds a node of the requested type at the given position', () => {
      useDiagramStore.getState().addNode('service', { x: 50, y: 60 })
      const { nodes } = useDiagramStore.getState()
      expect(nodes).toHaveLength(1)
      expect(nodes[0]!.type).toBe('service')
      expect(nodes[0]!.position).toEqual({ x: 50, y: 60 })
    })

    it('assigns a unique id to each node', () => {
      useDiagramStore.getState().addNode('rectangle', { x: 0, y: 0 })
      useDiagramStore.getState().addNode('rectangle', { x: 100, y: 0 })
      const { nodes } = useDiagramStore.getState()
      expect(nodes[0]!.id).not.toBe(nodes[1]!.id)
    })

    it('starts new nodes unlabeled (user types a label on demand)', () => {
      const types: NodeType[] = ['service', 'database', 'queue']
      for (const t of types) {
        useDiagramStore.getState().addNode(t, { x: 0, y: 0 })
      }
      const { nodes } = useDiagramStore.getState()
      expect(nodes.map((n) => n.data.label)).toEqual(['', '', ''])
    })

    it('beginEditNode/endEditNode track the inline-edit target and seed', () => {
      const id = useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
      useDiagramStore.getState().beginEditNode(id, 'A')
      expect(useDiagramStore.getState().editingNodeId).toBe(id)
      expect(useDiagramStore.getState().editSeed).toBe('A')
      useDiagramStore.getState().endEditNode()
      expect(useDiagramStore.getState().editingNodeId).toBeNull()
      expect(useDiagramStore.getState().editSeed).toBeNull()
    })
  })

  describe('addEdge', () => {
    it('connects two existing nodes', () => {
      const s = useDiagramStore.getState()
      s.addNode('service', { x: 0, y: 0 })
      s.addNode('database', { x: 200, y: 0 })
      const [n1, n2] = useDiagramStore.getState().nodes
      s.addEdge(n1!.id, n2!.id, { sourceHandle: 'right', targetHandle: 'left' })
      const { edges } = useDiagramStore.getState()
      expect(edges).toHaveLength(1)
      expect(edges[0]!.source).toBe(n1!.id)
      expect(edges[0]!.target).toBe(n2!.id)
      expect(edges[0]!.sourceHandle).toBe('right')
      expect(edges[0]!.targetHandle).toBe('left')
    })

    it('refuses to connect a node to itself', () => {
      const s = useDiagramStore.getState()
      s.addNode('service', { x: 0, y: 0 })
      const id = useDiagramStore.getState().nodes[0]!.id
      s.addEdge(id, id, { sourceHandle: 'right', targetHandle: 'left' })
      expect(useDiagramStore.getState().edges).toHaveLength(0)
    })

    it('setEdgeLabelT stores a clamped 0–1 fraction on the edge', () => {
      const s = useDiagramStore.getState()
      s.addNode('service', { x: 0, y: 0 })
      s.addNode('database', { x: 200, y: 0 })
      const [n1, n2] = useDiagramStore.getState().nodes
      s.addEdge(n1!.id, n2!.id, { sourceHandle: 'right', targetHandle: 'left' })
      const eid = useDiagramStore.getState().edges[0]!.id
      s.setEdgeLabelT(eid, 0.25)
      expect(useDiagramStore.getState().edges[0]!.data.labelT).toBe(0.25)
      s.setEdgeLabelT(eid, 5)
      expect(useDiagramStore.getState().edges[0]!.data.labelT).toBe(1)
      s.setEdgeLabelT(eid, -3)
      expect(useDiagramStore.getState().edges[0]!.data.labelT).toBe(0)
    })
  })

  describe('serialization', () => {
    it('exports a graffel document that round-trips back', () => {
      const s = useDiagramStore.getState()
      s.addNode('service', { x: 10, y: 20 })
      const doc = s.toDocument()
      expect(doc.nodes).toHaveLength(1)
      reset()
      expect(useDiagramStore.getState().nodes).toHaveLength(0)
      s.loadDocument(doc)
      expect(useDiagramStore.getState().nodes).toHaveLength(1)
      expect(useDiagramStore.getState().nodes[0]!.position).toEqual({
        x: 10,
        y: 20,
      })
    })
  })

  describe('updateNodePosition', () => {
    it('updates the position of an existing node', () => {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 0, y: 0 })
      const id = useDiagramStore.getState().nodes[0]!.id
      s.updateNodePosition(id, { x: 100, y: 100 })
      expect(useDiagramStore.getState().nodes[0]!.position).toEqual({
        x: 100,
        y: 100,
      })
    })
  })

  describe('grouping', () => {
    const PAD = 24

    it('groupNodes wraps top-level nodes in a padded container with relative child positions', () => {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 100, y: 100 }) // 160x80 default
      s.addNode('rectangle', { x: 300, y: 200 })
      const [a, b] = useDiagramStore.getState().nodes
      const gid = s.groupNodes([a!.id, b!.id])!
      const st = useDiagramStore.getState()
      const group = st.nodes.find((n) => n.id === gid)!
      expect(group.type).toBe('basic:group')
      // bbox x: 100..460, y: 100..280 → container origin is bbox-min minus PAD.
      expect(group.position).toEqual({ x: 100 - PAD, y: 100 - PAD })
      expect(group.size).toEqual({ w: (460 - 100) + 2 * PAD, h: (280 - 100) + 2 * PAD })
      const ca = st.nodes.find((n) => n.id === a!.id)!
      expect(ca.parentId).toBe(gid)
      expect(ca.position).toEqual({ x: PAD, y: PAD }) // 100 - (100-PAD)
      expect(st.selectedNodeIds).toEqual([gid])
    })

    it('ungroupNodes restores absolute positions and removes the container', () => {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 100, y: 100 })
      s.addNode('rectangle', { x: 300, y: 200 })
      const [a, b] = useDiagramStore.getState().nodes
      const gid = s.groupNodes([a!.id, b!.id])!
      s.ungroupNodes(gid)
      const st = useDiagramStore.getState()
      expect(st.nodes.find((n) => n.id === gid)).toBeUndefined()
      const ca = st.nodes.find((n) => n.id === a!.id)!
      expect(ca.parentId ?? null).toBeNull()
      expect(ca.position).toEqual({ x: 100, y: 100 })
    })

    it('deleting a container removes its descendants, and undo restores them', () => {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 100, y: 100 })
      s.addNode('rectangle', { x: 300, y: 200 })
      const [a, b] = useDiagramStore.getState().nodes
      const gid = s.groupNodes([a!.id, b!.id])!
      s.selectNodes([gid])
      s.removeSelection()
      expect(useDiagramStore.getState().nodes).toHaveLength(0)
      s.undo()
      expect(useDiagramStore.getState().nodes).toHaveLength(3)
    })

    it('duplicating a container clones its children with remapped parentId', () => {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 100, y: 100 })
      const a = useDiagramStore.getState().nodes[0]!
      const gid = s.groupNodes([a.id])!
      s.duplicateNodes([gid])
      const st = useDiagramStore.getState()
      expect(st.nodes).toHaveLength(4) // group+child + clonedGroup+clonedChild
      const groups = st.nodes.filter((n) => n.type === 'basic:group')
      expect(groups).toHaveLength(2)
      const newGroup = groups.find((g) => g.id !== gid)!
      expect(st.nodes.filter((n) => n.parentId === newGroup.id)).toHaveLength(1)
    })

    it('setNodeParent nests a node and converts its position to be parent-relative', () => {
      const s = useDiagramStore.getState()
      s.addNode('basic:group', { x: 50, y: 50 })
      s.addNode('rectangle', { x: 200, y: 150 })
      const [g, r] = useDiagramStore.getState().nodes
      s.setNodeParent(r!.id, g!.id)
      const cr = useDiagramStore.getState().nodes.find((n) => n.id === r!.id)!
      expect(cr.parentId).toBe(g!.id)
      expect(cr.position).toEqual({ x: 150, y: 100 })
      // Unparent restores absolute coords.
      s.setNodeParent(r!.id, null)
      const cr2 = useDiagramStore.getState().nodes.find((n) => n.id === r!.id)!
      expect(cr2.parentId ?? null).toBeNull()
      expect(cr2.position).toEqual({ x: 200, y: 150 })
    })

    it('setNodeParent refuses to nest a node inside its own descendant', () => {
      const s = useDiagramStore.getState()
      s.addNode('basic:group', { x: 0, y: 0 })
      s.addNode('basic:group', { x: 20, y: 20 })
      const [outer, inner] = useDiagramStore.getState().nodes
      s.setNodeParent(inner!.id, outer!.id) // inner now child of outer
      s.setNodeParent(outer!.id, inner!.id) // would create a cycle — must no-op
      const co = useDiagramStore.getState().nodes.find((n) => n.id === outer!.id)!
      expect(co.parentId ?? null).toBeNull()
    })
  })

  describe('clipboard paste + edge reconnection', () => {
    it('pasteFragment materializes nodes with fresh ids at the base position and selects them', () => {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 100, y: 100 })
      const a = useDiagramStore.getState().nodes[0]!
      const frag = buildFragment(useDiagramStore.getState().nodes, [], [a.id])
      const newIds = s.pasteFragment(frag, { x: 400, y: 300 })
      const st = useDiagramStore.getState()
      expect(newIds).toHaveLength(1)
      expect(st.nodes).toHaveLength(2)
      const pasted = st.nodes.find((n) => n.id === newIds[0])!
      expect(pasted.id).not.toBe(a.id)
      expect(pasted.position).toEqual({ x: 400, y: 300 })
      expect(st.selectedNodeIds).toEqual(newIds)
    })

    it('pasteFragment parents pasted roots to the current drill-down level', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.addNode('rectangle', { x: 500, y: 500 })
      const rect = useDiagramStore.getState().nodes[1]!
      const frag = buildFragment(useDiagramStore.getState().nodes, [], [rect.id])
      s.enterContainer(gid)
      const newIds = s.pasteFragment(frag, { x: 20, y: 30 })
      const pasted = useDiagramStore.getState().nodes.find((n) => n.id === newIds[0])!
      expect(pasted.parentId).toBe(gid)
    })

    it('pasteFragment rejects foreign payloads and is a no-op in read-only', () => {
      const s = useDiagramStore.getState()
      expect(s.pasteFragment({ hello: 'nope' } as never, { x: 0, y: 0 })).toEqual([])
      s.addNode('rectangle', { x: 0, y: 0 })
      const frag = buildFragment(useDiagramStore.getState().nodes, [], [useDiagramStore.getState().nodes[0]!.id])
      s.setReadOnly(true)
      expect(s.pasteFragment(frag, { x: 0, y: 0 })).toEqual([])
      expect(useDiagramStore.getState().nodes).toHaveLength(1)
    })

    it('updateEdgeConnection moves an endpoint (undoably) and refuses self-loops', () => {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 0, y: 0 })
      s.addNode('rectangle', { x: 200, y: 0 })
      s.addNode('rectangle', { x: 400, y: 0 })
      const [a, b, c] = useDiagramStore.getState().nodes
      s.addEdge(a!.id, b!.id, { sourceHandle: 'right', targetHandle: 'left' })
      const eid = useDiagramStore.getState().edges[0]!.id

      s.updateEdgeConnection(eid, { source: a!.id, sourceHandle: 'right', target: c!.id, targetHandle: 'left' })
      expect(useDiagramStore.getState().edges[0]!.target).toBe(c!.id)

      // Self-loop refused.
      s.updateEdgeConnection(eid, { source: a!.id, sourceHandle: 'right', target: a!.id, targetHandle: 'left' })
      expect(useDiagramStore.getState().edges[0]!.target).toBe(c!.id)

      s.undo()
      expect(useDiagramStore.getState().edges[0]!.target).toBe(b!.id)
    })
  })

  describe('drill-down', () => {
    it('enterContainer sets the view root for a container, and is a no-op otherwise', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      const rid = s.addNode('rectangle', { x: 200, y: 0 })
      s.enterContainer(rid) // not a container
      expect(useDiagramStore.getState().viewRootId).toBeNull()
      s.enterContainer('nope') // unknown id
      expect(useDiagramStore.getState().viewRootId).toBeNull()
      s.enterContainer(gid)
      expect(useDiagramStore.getState().viewRootId).toBe(gid)
      s.exitToLevel(null)
      expect(useDiagramStore.getState().viewRootId).toBeNull()
    })

    it('enterContainer works in read-only mode (share-link navigation)', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.setReadOnly(true)
      s.enterContainer(gid)
      expect(useDiagramStore.getState().viewRootId).toBe(gid)
    })

    it('addNode parents new nodes to the current view root', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 100, y: 100 })
      s.enterContainer(gid)
      const rid = s.addNode('rectangle', { x: 30, y: 40 })
      const r = useDiagramStore.getState().nodes.find((n) => n.id === rid)!
      expect(r.parentId).toBe(gid)
      expect(r.position).toEqual({ x: 30, y: 40 }) // already level-relative
    })

    it('toggleCollapsed flips the flag and is undoable', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.toggleCollapsed(gid)
      expect((useDiagramStore.getState().nodes[0]!.data as { collapsed?: boolean }).collapsed).toBe(true)
      s.undo()
      expect((useDiagramStore.getState().nodes[0]!.data as { collapsed?: boolean }).collapsed).toBeUndefined()
    })

    it('undo that removes the current view root resets the view to the diagram root', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.enterContainer(gid)
      s.undo() // un-create the group while inside it
      const st = useDiagramStore.getState()
      expect(st.nodes).toHaveLength(0)
      expect(st.viewRootId).toBeNull()
    })

    it('revealNode drills to a node\'s parent level and selects it', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.enterContainer(gid)
      const childId = s.addNode('rectangle', { x: 10, y: 10 }) // parented to gid
      s.exitToLevel(null)
      s.revealNode(childId)
      const st = useDiagramStore.getState()
      expect(st.viewRootId).toBe(gid)
      expect(st.selectedNodeIds).toEqual([childId])
    })

    it('revealNode of a top-level node returns to the root level', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.addNode('rectangle', { x: 400, y: 0 }) // top-level
      const topId = useDiagramStore.getState().nodes[1]!.id
      s.enterContainer(gid)
      s.revealNode(topId)
      const st = useDiagramStore.getState()
      expect(st.viewRootId).toBeNull()
      expect(st.selectedNodeIds).toEqual([topId])
    })

    it('revealNode works in read-only mode (share navigation)', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.enterContainer(gid)
      const childId = s.addNode('rectangle', { x: 10, y: 10 })
      s.exitToLevel(null)
      s.setReadOnly(true)
      s.revealNode(childId)
      expect(useDiagramStore.getState().viewRootId).toBe(gid)
    })

    it('loadDocument resets the view root', () => {
      const s = useDiagramStore.getState()
      const gid = s.addNode('basic:group', { x: 0, y: 0 })
      s.enterContainer(gid)
      const doc = s.toDocument()
      s.loadDocument(doc)
      expect(useDiagramStore.getState().viewRootId).toBeNull()
    })
  })

  describe('z-order', () => {
    function threeNodes() {
      const s = useDiagramStore.getState()
      s.addNode('rectangle', { x: 0, y: 0 })
      s.addNode('rectangle', { x: 50, y: 0 })
      s.addNode('rectangle', { x: 100, y: 0 })
      return useDiagramStore.getState().nodes.map((n) => n.id) // [a, b, c]
    }

    it('bringToFront moves the node to the end of the array (top of stack)', () => {
      const [a, b, c] = threeNodes()
      useDiagramStore.getState().bringToFront([a!])
      expect(useDiagramStore.getState().nodes.map((n) => n.id)).toEqual([b, c, a])
    })

    it('sendToBack moves the node to the front of the array (bottom of stack)', () => {
      const [a, b, c] = threeNodes()
      useDiagramStore.getState().sendToBack([c!])
      expect(useDiagramStore.getState().nodes.map((n) => n.id)).toEqual([c, a, b])
    })

    it('bringForward moves the node one step toward the top', () => {
      const [a, b, c] = threeNodes()
      useDiagramStore.getState().bringForward([a!])
      expect(useDiagramStore.getState().nodes.map((n) => n.id)).toEqual([b, a, c])
    })

    it('sendBackward moves the node one step toward the bottom', () => {
      const [a, b, c] = threeNodes()
      useDiagramStore.getState().sendBackward([c!])
      expect(useDiagramStore.getState().nodes.map((n) => n.id)).toEqual([a, c, b])
    })

    it('z-order changes are undoable', () => {
      const [a, b, c] = threeNodes()
      useDiagramStore.getState().bringToFront([a!])
      useDiagramStore.getState().undo()
      expect(useDiagramStore.getState().nodes.map((n) => n.id)).toEqual([a, b, c])
    })
  })

  describe('removeSelection', () => {
    it('removes selected nodes and their incident edges', () => {
      const s = useDiagramStore.getState()
      s.addNode('service', { x: 0, y: 0 })
      s.addNode('database', { x: 200, y: 0 })
      const [n1, n2] = useDiagramStore.getState().nodes
      s.addEdge(n1!.id, n2!.id, { sourceHandle: 'right', targetHandle: 'left' })
      s.selectNodes([n1!.id])
      s.removeSelection()
      const state = useDiagramStore.getState()
      expect(state.nodes).toHaveLength(1)
      expect(state.nodes[0]!.id).toBe(n2!.id)
      expect(state.edges).toHaveLength(0)
    })
  })
})
