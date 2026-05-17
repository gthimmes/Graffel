import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'

function reset() {
  useDiagramStore.getState().reset()
}

describe('diagramStore — styling extensions (v1.1)', () => {
  beforeEach(reset)

  it('updateNodeSize updates a node\'s width and height', () => {
    const s = useDiagramStore.getState()
    s.addNode('rectangle', { x: 0, y: 0 })
    const id = useDiagramStore.getState().nodes[0]!.id
    s.updateNodeSize(id, { w: 240, h: 120 })
    expect(useDiagramStore.getState().nodes[0]!.size).toEqual({ w: 240, h: 120 })
  })

  it('updateNodeStyle merges style without dropping existing fields', () => {
    const s = useDiagramStore.getState()
    s.addNode('service', { x: 0, y: 0 })
    const id = useDiagramStore.getState().nodes[0]!.id
    s.updateNodeStyle(id, { fontFamily: 'inter', fontSize: 14 })
    s.updateNodeStyle(id, { textColor: '#ff0000' })
    const style = useDiagramStore.getState().nodes[0]!.data.style as Record<string, unknown>
    expect(style.fontFamily).toBe('inter')
    expect(style.fontSize).toBe(14)
    expect(style.textColor).toBe('#ff0000')
  })

  it('updateEdgeStyle merges edge style', () => {
    const s = useDiagramStore.getState()
    s.addNode('service', { x: 0, y: 0 })
    s.addNode('database', { x: 200, y: 0 })
    const [n1, n2] = useDiagramStore.getState().nodes
    s.addEdge(n1!.id, n2!.id, { sourceHandle: 'right', targetHandle: 'left' })
    const eid = useDiagramStore.getState().edges[0]!.id
    s.updateEdgeStyle(eid, { strokeColor: '#000000', strokeWidth: 3 })
    const style = useDiagramStore.getState().edges[0]!.data.style as Record<string, unknown>
    expect(style.strokeColor).toBe('#000000')
    expect(style.strokeWidth).toBe(3)
  })

  it('updateEdgeType switches the edge between orthogonal / straight / bezier', () => {
    const s = useDiagramStore.getState()
    s.addNode('service', { x: 0, y: 0 })
    s.addNode('database', { x: 200, y: 0 })
    const [n1, n2] = useDiagramStore.getState().nodes
    s.addEdge(n1!.id, n2!.id, { sourceHandle: 'right', targetHandle: 'left' })
    const eid = useDiagramStore.getState().edges[0]!.id
    s.updateEdgeType(eid, 'bezier')
    expect(useDiagramStore.getState().edges[0]!.type).toBe('bezier')
    s.updateEdgeType(eid, 'straight')
    expect(useDiagramStore.getState().edges[0]!.type).toBe('straight')
  })

  it('style and size changes survive a round-trip through toDocument/loadDocument', () => {
    const s = useDiagramStore.getState()
    s.addNode('service', { x: 10, y: 20 })
    const id = useDiagramStore.getState().nodes[0]!.id
    s.updateNodeSize(id, { w: 300, h: 100 })
    s.updateNodeStyle(id, { fontFamily: 'mono', fontSize: 18, textColor: '#0044ff' })
    const doc = s.toDocument()
    reset()
    useDiagramStore.getState().loadDocument(doc)
    const restored = useDiagramStore.getState().nodes[0]!
    expect(restored.size).toEqual({ w: 300, h: 100 })
    const style = restored.data.style as Record<string, unknown>
    expect(style.fontFamily).toBe('mono')
    expect(style.fontSize).toBe(18)
    expect(style.textColor).toBe('#0044ff')
  })
})
