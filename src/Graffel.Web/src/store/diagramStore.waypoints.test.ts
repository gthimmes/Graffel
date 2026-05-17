import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'

function seedEdge(): string {
  const s = useDiagramStore.getState()
  s.addNode('service', { x: 0, y: 0 })
  s.addNode('database', { x: 400, y: 200 })
  const [a, b] = useDiagramStore.getState().nodes
  return s.addEdge(a!.id, b!.id, { sourceHandle: 'right', targetHandle: 'left' })!
}

function waypointsOf(edgeId: string): Array<{ x: number; y: number }> {
  const e = useDiagramStore.getState().edges.find((x) => x.id === edgeId)!
  return e.data.waypoints ?? []
}

describe('diagramStore — waypoints (v1.2)', () => {
  beforeEach(() => useDiagramStore.getState().reset())

  it('a new edge has no waypoints', () => {
    const id = seedEdge()
    expect(waypointsOf(id)).toEqual([])
  })

  it('addEdgeWaypoint inserts at the end when no index is given', () => {
    const id = seedEdge()
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 100, y: 50 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 200, y: 80 })
    expect(waypointsOf(id)).toEqual([{ x: 100, y: 50 }, { x: 200, y: 80 }])
  })

  it('addEdgeWaypoint inserts at a specific index when one is given', () => {
    const id = seedEdge()
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 100, y: 50 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 200, y: 80 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 150, y: 60 }, 1)
    expect(waypointsOf(id)).toEqual([
      { x: 100, y: 50 },
      { x: 150, y: 60 },
      { x: 200, y: 80 },
    ])
  })

  it('moveEdgeWaypoint updates one waypoint by index', () => {
    const id = seedEdge()
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 100, y: 50 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 200, y: 80 })
    useDiagramStore.getState().moveEdgeWaypoint(id, 1, { x: 250, y: 90 })
    expect(waypointsOf(id)).toEqual([{ x: 100, y: 50 }, { x: 250, y: 90 }])
  })

  it('moveEdgeWaypoint is a no-op for an out-of-range index', () => {
    const id = seedEdge()
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 100, y: 50 })
    useDiagramStore.getState().moveEdgeWaypoint(id, 5, { x: 999, y: 999 })
    expect(waypointsOf(id)).toEqual([{ x: 100, y: 50 }])
  })

  it('removeEdgeWaypoint drops one waypoint by index', () => {
    const id = seedEdge()
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 100, y: 50 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 200, y: 80 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 300, y: 90 })
    useDiagramStore.getState().removeEdgeWaypoint(id, 1)
    expect(waypointsOf(id)).toEqual([{ x: 100, y: 50 }, { x: 300, y: 90 }])
  })

  it('clearEdgeWaypoints empties the array', () => {
    const id = seedEdge()
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 100, y: 50 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 200, y: 80 })
    useDiagramStore.getState().clearEdgeWaypoints(id)
    expect(waypointsOf(id)).toEqual([])
  })

  it('waypoints survive toDocument/loadDocument round-trip', () => {
    const id = seedEdge()
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 100, y: 50 })
    useDiagramStore.getState().addEdgeWaypoint(id, { x: 200, y: 80 })
    const doc = useDiagramStore.getState().toDocument()
    useDiagramStore.getState().reset()
    expect(useDiagramStore.getState().edges).toHaveLength(0)
    useDiagramStore.getState().loadDocument(doc)
    const restored = useDiagramStore.getState().edges[0]!
    expect(restored.data.waypoints).toEqual([
      { x: 100, y: 50 },
      { x: 200, y: 80 },
    ])
  })
})
