import { describe, expect, it } from 'vitest'
import { buildGraph } from './buildGraph'
import type { MermaidGraph, MermaidNode, MermaidShape } from './parseMermaid'

const mn = (id: string, shape: MermaidShape, parentId: string | null = null): MermaidNode => ({
  id,
  label: id.toUpperCase(),
  shape,
  parentId,
})

const g = (over: Partial<MermaidGraph>): MermaidGraph => ({
  direction: 'DOWN',
  nodes: [],
  edges: [],
  ...over,
})

describe('buildGraph', () => {
  it('maps Mermaid shapes onto Graffel shape ids', () => {
    const { nodes } = buildGraph(
      g({
        nodes: [
          mn('a', 'rect'),
          mn('b', 'diamond'),
          mn('c', 'circle'),
          mn('d', 'cylinder'),
          mn('e', 'stadium'),
          mn('f', 'round'),
          mn('s', 'subgraph'),
        ],
      }),
    )
    expect(nodes.map((n) => n.type)).toEqual([
      'basic:rectangle',
      'basic:diamond',
      'basic:ellipse',
      'arch-core:database',
      'basic:rectangle',
      'basic:rectangle',
      'basic:group',
    ])
  })

  it('carries the label and gives each node a registry default size', () => {
    const { nodes } = buildGraph(g({ nodes: [{ id: 'a', label: 'Web App', shape: 'rect', parentId: null }] }))
    expect(nodes[0].data.label).toBe('Web App')
    expect(nodes[0].size).toEqual({ w: 160, h: 80 })
    expect(nodes[0].parentId).toBeNull()
  })

  it('carries the parent link through to the Graffel node', () => {
    const { nodes } = buildGraph(
      g({ nodes: [mn('box', 'subgraph'), mn('a', 'rect', 'box')] }),
    )
    expect(nodes.find((n) => n.id === 'a')!.parentId).toBe('box')
  })

  it('keeps the Mermaid id as the node id (so edges resolve)', () => {
    const { nodes, edges } = buildGraph(
      g({
        nodes: [mn('a', 'rect'), mn('b', 'rect')],
        edges: [{ source: 'a', target: 'b', label: 'x' }],
      }),
    )
    expect(nodes.map((n) => n.id)).toEqual(['a', 'b'])
    expect(edges[0]).toMatchObject({ source: 'a', target: 'b' })
    expect(edges[0].data.label).toBe('x')
  })

  it('gives edges unique deterministic ids', () => {
    const { edges } = buildGraph(
      g({
        nodes: [mn('a', 'rect'), mn('b', 'rect')],
        edges: [
          { source: 'a', target: 'b', label: '' },
          { source: 'b', target: 'a', label: '' },
        ],
      }),
    )
    expect(new Set(edges.map((e) => e.id)).size).toBe(2)
  })

  it('uses left-to-right handles for a RIGHT graph', () => {
    const { edges } = buildGraph(
      g({
        direction: 'RIGHT',
        nodes: [mn('a', 'rect'), mn('b', 'rect')],
        edges: [{ source: 'a', target: 'b', label: '' }],
      }),
    )
    expect(edges[0]).toMatchObject({ sourceHandle: 'right', targetHandle: 'left' })
  })

  it('uses top-to-bottom handles for a DOWN graph', () => {
    const { edges } = buildGraph(
      g({
        direction: 'DOWN',
        nodes: [mn('a', 'rect'), mn('b', 'rect')],
        edges: [{ source: 'a', target: 'b', label: '' }],
      }),
    )
    expect(edges[0]).toMatchObject({ sourceHandle: 'bottom', targetHandle: 'top' })
  })
})
