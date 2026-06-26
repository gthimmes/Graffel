import { describe, expect, it } from 'vitest'
import { buildGraph } from './buildGraph'
import type { MermaidGraph } from './parseMermaid'

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
          { id: 'a', label: 'A', shape: 'rect' },
          { id: 'b', label: 'B', shape: 'diamond' },
          { id: 'c', label: 'C', shape: 'circle' },
          { id: 'd', label: 'D', shape: 'cylinder' },
          { id: 'e', label: 'E', shape: 'stadium' },
          { id: 'f', label: 'F', shape: 'round' },
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
    ])
  })

  it('carries the label and gives each node a registry default size', () => {
    const { nodes } = buildGraph(g({ nodes: [{ id: 'a', label: 'Web App', shape: 'rect' }] }))
    expect(nodes[0].data.label).toBe('Web App')
    expect(nodes[0].size).toEqual({ w: 160, h: 80 })
    expect(nodes[0].parentId).toBeNull()
  })

  it('keeps the Mermaid id as the node id (so edges resolve)', () => {
    const { nodes, edges } = buildGraph(
      g({
        nodes: [
          { id: 'a', label: 'A', shape: 'rect' },
          { id: 'b', label: 'B', shape: 'rect' },
        ],
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
        nodes: [
          { id: 'a', label: 'A', shape: 'rect' },
          { id: 'b', label: 'B', shape: 'rect' },
        ],
        edges: [
          { source: 'a', target: 'b', label: '' },
          { source: 'b', target: 'a', label: '' },
        ],
      }),
    )
    const ids = edges.map((e) => e.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('uses left-to-right handles for a RIGHT graph', () => {
    const { edges } = buildGraph(
      g({
        direction: 'RIGHT',
        nodes: [
          { id: 'a', label: 'A', shape: 'rect' },
          { id: 'b', label: 'B', shape: 'rect' },
        ],
        edges: [{ source: 'a', target: 'b', label: '' }],
      }),
    )
    expect(edges[0].sourceHandle).toBe('right')
    expect(edges[0].targetHandle).toBe('left')
  })

  it('uses top-to-bottom handles for a DOWN graph', () => {
    const { edges } = buildGraph(
      g({
        direction: 'DOWN',
        nodes: [
          { id: 'a', label: 'A', shape: 'rect' },
          { id: 'b', label: 'B', shape: 'rect' },
        ],
        edges: [{ source: 'a', target: 'b', label: '' }],
      }),
    )
    expect(edges[0].sourceHandle).toBe('bottom')
    expect(edges[0].targetHandle).toBe('top')
  })
})
