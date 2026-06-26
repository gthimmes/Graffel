import { describe, expect, it } from 'vitest'
import { toMermaid } from './toMermaid'
import type { GraffelEdge, GraffelNode } from '../types'

function node(id: string, type: string, label: string): GraffelNode {
  return { id, type, parentId: null, position: { x: 0, y: 0 }, size: { w: 160, h: 80 }, data: { label } }
}
function edge(id: string, source: string, target: string, label = ''): GraffelEdge {
  return { id, source, target, sourceHandle: 'right', targetHandle: 'left', type: 'orthogonal', data: { label } }
}

describe('toMermaid', () => {
  it('emits a header reflecting the direction', () => {
    expect(toMermaid([node('a', 'basic:rectangle', 'A')], [], { direction: 'DOWN' })).toMatch(/^graph TD/)
    expect(toMermaid([node('a', 'basic:rectangle', 'A')], [], { direction: 'RIGHT' })).toMatch(/^graph LR/)
  })

  it('aliases opaque node ids to stable short names', () => {
    const out = toMermaid([node('n_01ABC', 'basic:rectangle', 'Web')], [])
    expect(out).toContain('N0["Web"]')
    expect(out).not.toContain('n_01ABC')
  })

  it('maps shapes to the matching Mermaid wrapper', () => {
    const nodes = [
      node('a', 'basic:rectangle', 'Rect'),
      node('b', 'basic:diamond', 'Dec'),
      node('c', 'basic:ellipse', 'Circ'),
      node('d', 'arch-core:database', 'Store'),
    ]
    const out = toMermaid(nodes, [])
    expect(out).toContain('N0["Rect"]')
    expect(out).toContain('N1{"Dec"}')
    expect(out).toContain('N2(("Circ"))')
    expect(out).toContain('N3[("Store")]')
  })

  it('renders edges by alias, with labels when present', () => {
    const nodes = [node('a', 'basic:rectangle', 'A'), node('b', 'basic:rectangle', 'B')]
    const out = toMermaid(nodes, [edge('e1', 'a', 'b', 'calls')])
    expect(out).toContain('N0 -->|"calls"| N1')
  })

  it('omits the label pipe when an edge has none', () => {
    const nodes = [node('a', 'basic:rectangle', 'A'), node('b', 'basic:rectangle', 'B')]
    const out = toMermaid(nodes, [edge('e1', 'a', 'b')])
    expect(out).toMatch(/N0 --> N1/)
    expect(out).not.toContain('|')
  })

  it('falls back to the alias when a node has no label', () => {
    expect(toMermaid([node('a', 'basic:rectangle', '')], [])).toContain('N0["N0"]')
  })

  it('round-trips back through the parser', async () => {
    const { parseMermaid } = await import('./parseMermaid')
    const nodes = [
      node('a', 'basic:rectangle', 'Web App'),
      node('b', 'basic:diamond', 'Auth?'),
      node('c', 'arch-core:database', 'DB'),
    ]
    const edges = [edge('e1', 'a', 'b', 'login'), edge('e2', 'b', 'c')]
    const round = parseMermaid(toMermaid(nodes, edges, { direction: 'RIGHT' }))
    expect(round.direction).toBe('RIGHT')
    expect(round.nodes.map((n) => n.label)).toEqual(['Web App', 'Auth?', 'DB'])
    expect(round.nodes.map((n) => n.shape)).toEqual(['rect', 'diamond', 'cylinder'])
    expect(round.edges.map((e) => e.label)).toEqual(['login', ''])
  })
})
