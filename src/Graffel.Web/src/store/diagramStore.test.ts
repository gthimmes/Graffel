import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'
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

    it('sets a sensible default label per node type', () => {
      const types: NodeType[] = ['service', 'database', 'queue']
      for (const t of types) {
        useDiagramStore.getState().addNode(t, { x: 0, y: 0 })
      }
      const { nodes } = useDiagramStore.getState()
      expect(nodes.map((n) => n.data.label)).toEqual([
        'Service',
        'Database',
        'Queue',
      ])
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
