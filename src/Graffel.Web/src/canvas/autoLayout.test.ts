import { describe, expect, it } from 'vitest'
import { buildElkGraph, elkPositions, layoutLevel, type LayoutEdge, type LayoutNode } from './autoLayout'

const N = (id: string, w = 120, h = 70): LayoutNode => ({ id, size: { w, h } })

describe('buildElkGraph', () => {
  it('maps nodes to ELK children with their measured size', () => {
    const g = buildElkGraph([N('a', 120, 70), N('b', 90, 200)], [])
    expect(g.children).toEqual([
      { id: 'a', width: 120, height: 70 },
      { id: 'b', width: 90, height: 200 },
    ])
  })

  it('includes only edges whose endpoints are both in the level', () => {
    const edges: LayoutEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'a', target: 'outside' }, // dropped — target not present
    ]
    const g = buildElkGraph([N('a'), N('b')], edges)
    expect(g.edges).toEqual([{ id: 'e1', sources: ['a'], targets: ['b'] }])
  })

  it('honors direction + spacing options in the layout options', () => {
    const g = buildElkGraph([N('a')], [], { direction: 'DOWN', nodeSpacing: 40, layerSpacing: 120 })
    expect(g.layoutOptions!['elk.direction']).toBe('DOWN')
    expect(g.layoutOptions!['elk.spacing.nodeNode']).toBe('40')
    expect(g.layoutOptions!['elk.layered.spacing.nodeNodeBetweenLayers']).toBe('120')
  })
})

describe('elkPositions', () => {
  it('extracts x/y for every positioned child', () => {
    const positioned = { id: 'root', children: [
      { id: 'a', x: 0, y: 0, width: 120, height: 70 },
      { id: 'b', x: 210, y: 0, width: 120, height: 70 },
    ] }
    expect(elkPositions(positioned)).toEqual({ a: { x: 0, y: 0 }, b: { x: 210, y: 0 } })
  })

  it('skips children without coordinates', () => {
    const g = { id: 'root', children: [{ id: 'a', width: 1, height: 1 }] }
    expect(elkPositions(g)).toEqual({})
  })
})

describe('layoutLevel (integration with ELK)', () => {
  it('returns no positions for an empty level', async () => {
    expect(await layoutLevel([], [])).toEqual({})
  })

  it('lays a→b→c left-to-right into separated, non-overlapping layers', async () => {
    const nodes = [N('a'), N('b'), N('c')]
    const edges: LayoutEdge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ]
    const pos = await layoutLevel(nodes, edges, { direction: 'RIGHT' })
    expect(Object.keys(pos).sort()).toEqual(['a', 'b', 'c'])
    // Following the edges, each successor sits strictly to the right.
    expect(pos.b!.x).toBeGreaterThan(pos.a!.x)
    expect(pos.c!.x).toBeGreaterThan(pos.b!.x)
    // Layers are separated by at least the node width (no overlap along the flow).
    expect(pos.b!.x - pos.a!.x).toBeGreaterThanOrEqual(120)
  })
})
