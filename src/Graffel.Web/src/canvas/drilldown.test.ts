import { describe, expect, it } from 'vitest'
import type { GraffelEdge, GraffelNode } from '../format/types'
import { indexNodes } from './nesting'
import { remapEdgeForView, visibleNodeIds, visibleRepresentative } from './drilldown'

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
