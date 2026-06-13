import { describe, expect, it } from 'vitest'
import type { GraffelEdge, GraffelNode } from '../format/types'
import { indexNodes } from './nesting'
import { boundaryStubsForView, remapEdgeForView, visibleNodeIds, visibleRepresentative } from './drilldown'

function node(
  id: string,
  parentId: string | null = null,
  opts: { container?: boolean; collapsed?: boolean } = {},
): GraffelNode {
  return {
    id,
    type: opts.container ? 'basic:group' : 'basic:rectangle',
    parentId,
    position: { x: 0, y: 0 },
    size: { w: 100, h: 60 },
    data: { label: '', ...(opts.collapsed ? { collapsed: true } : {}) },
  }
}

function edge(id: string, source: string, target: string): GraffelEdge {
  return { id, source, sourceHandle: 'right', target, targetHandle: 'left', type: 'straight', data: { label: '' } }
}

// A fixture tree:
//   a (top-level plain)
//   box (container) ── x, y (children); y is itself a container with child z
const FIXTURE = [
  node('a'),
  node('box', null, { container: true }),
  node('x', 'box'),
  node('y', 'box', { container: true }),
  node('z', 'y'),
]

describe('visibleNodeIds', () => {
  it('at root with nothing collapsed, every node is visible', () => {
    const v = visibleNodeIds(FIXTURE, null)
    expect(v).toEqual(new Set(['a', 'box', 'x', 'y', 'z']))
  })

  it('a collapsed container hides its subtree but stays visible itself', () => {
    const nodes = [
      node('a'),
      node('box', null, { container: true, collapsed: true }),
      node('x', 'box'),
      node('y', 'box', { container: true }),
      node('z', 'y'),
    ]
    expect(visibleNodeIds(nodes, null)).toEqual(new Set(['a', 'box']))
  })

  it('drilled into a container, only its subtree is visible', () => {
    expect(visibleNodeIds(FIXTURE, 'box')).toEqual(new Set(['x', 'y', 'z']))
  })

  it('a collapsed sub-container inside the drilled view hides its own subtree', () => {
    const nodes = [
      node('box', null, { container: true }),
      node('x', 'box'),
      node('y', 'box', { container: true, collapsed: true }),
      node('z', 'y'),
    ]
    expect(visibleNodeIds(nodes, 'box')).toEqual(new Set(['x', 'y']))
  })
})

describe('visibleRepresentative', () => {
  it('returns the node itself when visible', () => {
    const byId = indexNodes(FIXTURE)
    const visible = new Set(['a', 'box'])
    expect(visibleRepresentative('a', visible, byId)).toBe('a')
  })

  it('walks up to the nearest visible ancestor (collapsed container)', () => {
    const byId = indexNodes(FIXTURE)
    const visible = new Set(['a', 'box'])
    expect(visibleRepresentative('z', visible, byId)).toBe('box')
  })

  it('returns null when no ancestor is visible (outside the drilled subtree)', () => {
    const byId = indexNodes(FIXTURE)
    const visible = new Set(['x', 'y', 'z']) // drilled into box
    expect(visibleRepresentative('a', visible, byId)).toBeNull()
  })
})

describe('remapEdgeForView', () => {
  const byId = indexNodes(FIXTURE)

  it('keeps an edge whose endpoints are both visible, unchanged', () => {
    const visible = visibleNodeIds(FIXTURE, null)
    const r = remapEdgeForView(edge('e1', 'a', 'x'), visible, byId)
    expect(r).toEqual({ source: 'a', target: 'x' })
  })

  it('re-targets an endpoint hidden inside a collapsed container to that container', () => {
    const visible = new Set(['a', 'box']) // box collapsed
    const r = remapEdgeForView(edge('e1', 'a', 'z'), visible, byId)
    expect(r).toEqual({ source: 'a', target: 'box' })
  })

  it('drops an edge when an endpoint is outside the drilled subtree', () => {
    const visible = new Set(['x', 'y', 'z']) // drilled into box
    expect(remapEdgeForView(edge('e1', 'a', 'x'), visible, byId)).toBeNull()
  })

  it('drops an edge whose endpoints collapse onto the same node', () => {
    const visible = new Set(['a', 'box']) // box collapsed; x and z both inside
    expect(remapEdgeForView(edge('e1', 'x', 'z'), visible, byId)).toBeNull()
  })
})

describe('boundaryStubsForView', () => {
  // Drilled into `box`: x, y, z visible; `web` (top-level) is outside the level.
  const NODES = [
    { ...node('web'), data: { label: 'Web App' } },
    node('plain'), // top-level, no text label → shape-label fallback
    node('box', null, { container: true }),
    node('x', 'box'),
    node('y', 'box', { container: true }),
    node('z', 'y'),
  ]
  const byId = indexNodes(NODES)
  const visible = visibleNodeIds(NODES, 'box') // {x, y, z}

  it('emits an outbound stub when the source is visible and the target is outside', () => {
    const stubs = boundaryStubsForView([edge('e1', 'x', 'web')], NODES, visible, byId)
    expect(stubs).toEqual([{ edgeId: 'e1', nodeId: 'x', dir: 'out', peerId: 'web', label: 'Web App' }])
  })

  it('emits an inbound stub when the target is visible and the source is outside', () => {
    const stubs = boundaryStubsForView([edge('e1', 'web', 'x')], NODES, visible, byId)
    expect(stubs).toEqual([{ edgeId: 'e1', nodeId: 'x', dir: 'in', peerId: 'web', label: 'Web App' }])
  })

  it('falls back to the peer shape label when it has no text label', () => {
    const stubs = boundaryStubsForView([edge('e1', 'x', 'plain')], NODES, visible, byId)
    expect(stubs[0]!.label).toBe('Rectangle')
  })

  it('emits nothing when both endpoints are visible (normal edge)', () => {
    expect(boundaryStubsForView([edge('e1', 'x', 'y')], NODES, visible, byId)).toEqual([])
  })

  it('emits nothing when neither endpoint is visible', () => {
    const vy = visibleNodeIds(NODES, 'y') // {z} (and y is the root, not visible)
    expect(boundaryStubsForView([edge('e1', 'web', 'x')], NODES, vy, byId)).toEqual([])
  })

  it('skips a stub whose peer node no longer exists', () => {
    expect(boundaryStubsForView([edge('e1', 'x', 'ghost')], NODES, visible, byId)).toEqual([])
  })
})
