import { describe, expect, it } from 'vitest'
import {
  buildElkGraph,
  buildNestedElkGraph,
  elkNestedResult,
  elkPositions,
  layoutLevel,
  layoutNested,
  type LayoutEdge,
  type LayoutNode,
  type NestedLayoutNode,
} from './autoLayout'

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

const NN = (id: string, parentId: string | null = null, isContainer = false): NestedLayoutNode => ({
  id,
  size: { w: 120, h: 70 },
  parentId,
  isContainer,
})

describe('buildNestedElkGraph', () => {
  it('nests children inside their container node', () => {
    const g = buildNestedElkGraph(
      [NN('box', null, true), NN('a', 'box'), NN('b', 'box'), NN('top')],
      [],
    )
    const ids = (g.children ?? []).map((c) => c.id).sort()
    expect(ids).toEqual(['box', 'top'])
    const box = g.children!.find((c) => c.id === 'box')!
    expect((box.children ?? []).map((c) => c.id).sort()).toEqual(['a', 'b'])
  })

  it('gives leaves a measured size and containers a layout algorithm (size computed)', () => {
    const g = buildNestedElkGraph([NN('box', null, true), NN('a', 'box')], [])
    const box = g.children!.find((c) => c.id === 'box')!
    const a = box.children!.find((c) => c.id === 'a')!
    expect(a).toMatchObject({ width: 120, height: 70 })
    expect(box.layoutOptions!['elk.algorithm']).toBe('layered')
    expect(box.width).toBeUndefined() // ELK computes the container's size
  })

  it('turns on cross-hierarchy edge handling at the root', () => {
    const g = buildNestedElkGraph([NN('a'), NN('b')], [{ id: 'e1', source: 'a', target: 'b' }])
    expect(g.layoutOptions!['elk.hierarchyHandling']).toBe('INCLUDE_CHILDREN')
    expect(g.edges).toEqual([{ id: 'e1', sources: ['a'], targets: ['b'] }])
  })
})

describe('elkNestedResult', () => {
  it('reads positions for all nodes and sizes only for containers', () => {
    const positioned = {
      id: 'root',
      children: [
        {
          id: 'box',
          x: 10,
          y: 20,
          width: 300,
          height: 180,
          children: [
            { id: 'a', x: 14, y: 34, width: 120, height: 70 },
            { id: 'b', x: 14, y: 110, width: 120, height: 70 },
          ],
        },
        { id: 'top', x: 400, y: 0, width: 120, height: 70 },
      ],
    }
    const { positions, sizes } = elkNestedResult(positioned)
    expect(positions).toEqual({
      box: { x: 10, y: 20 },
      a: { x: 14, y: 34 }, // relative to the container — exactly how we store it
      b: { x: 14, y: 110 },
      top: { x: 400, y: 0 },
    })
    expect(sizes).toEqual({ box: { w: 300, h: 180 } })
  })
})

describe('layoutNested (integration with ELK)', () => {
  it('lays a container around its children and sizes it to contain them', async () => {
    const { positions, sizes } = await layoutNested(
      [NN('box', null, true), NN('a', 'box'), NN('b', 'box')],
      [{ id: 'e1', source: 'a', target: 'b' }],
      { direction: 'DOWN' },
    )
    expect(positions.a).toBeDefined()
    expect(positions.b).toBeDefined()
    // The container got a computed size big enough for two stacked 120×70 nodes.
    expect(sizes.box!.w).toBeGreaterThanOrEqual(120)
    expect(sizes.box!.h).toBeGreaterThanOrEqual(140)
  })
})
