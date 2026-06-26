import { describe, expect, it } from 'vitest'
import { parseMermaid } from './parseMermaid'

describe('parseMermaid — header & direction', () => {
  it('reads a top-down header', () => {
    const g = parseMermaid('graph TD\n  A --> B')
    expect(g.direction).toBe('DOWN')
  })

  it('maps LR / RL to RIGHT and TB / BT to DOWN', () => {
    expect(parseMermaid('flowchart LR\nA-->B').direction).toBe('RIGHT')
    expect(parseMermaid('graph RL\nA-->B').direction).toBe('RIGHT')
    expect(parseMermaid('graph TB\nA-->B').direction).toBe('DOWN')
    expect(parseMermaid('graph BT\nA-->B').direction).toBe('DOWN')
  })

  it('accepts "flowchart" as well as "graph"', () => {
    expect(parseMermaid('flowchart TD\nA-->B').nodes).toHaveLength(2)
  })

  it('defaults direction to DOWN when omitted', () => {
    expect(parseMermaid('graph\nA-->B').direction).toBe('DOWN')
  })

  it('throws when the header is not a flowchart', () => {
    expect(() => parseMermaid('sequenceDiagram\nA->>B: hi')).toThrow()
    expect(() => parseMermaid('')).toThrow()
  })
})

describe('parseMermaid — nodes & edges', () => {
  it('creates two nodes and one edge for A --> B', () => {
    const g = parseMermaid('graph TD\nA --> B')
    expect(g.nodes.map((n) => n.id)).toEqual(['A', 'B'])
    expect(g.edges).toEqual([{ source: 'A', target: 'B', label: '' }])
  })

  it('defaults a bare node label to its id and shape to rect', () => {
    const g = parseMermaid('graph TD\nA --> B')
    expect(g.nodes[0]).toEqual({ id: 'A', label: 'A', shape: 'rect' })
  })

  it('parses every common shape wrapper', () => {
    const g = parseMermaid(`graph TD
      R[Rect]
      O(Round)
      S([Stadium])
      D{Decision}
      C((Circle))
      Y[(Store)]`)
    const byId = Object.fromEntries(g.nodes.map((n) => [n.id, n]))
    expect(byId.R).toMatchObject({ label: 'Rect', shape: 'rect' })
    expect(byId.O).toMatchObject({ label: 'Round', shape: 'round' })
    expect(byId.S).toMatchObject({ label: 'Stadium', shape: 'stadium' })
    expect(byId.D).toMatchObject({ label: 'Decision', shape: 'diamond' })
    expect(byId.C).toMatchObject({ label: 'Circle', shape: 'circle' })
    expect(byId.Y).toMatchObject({ label: 'Store', shape: 'cylinder' })
  })

  it('records each node once, in first-seen order, even when re-referenced', () => {
    const g = parseMermaid('graph TD\nA --> B\nB --> C\nA --> C')
    expect(g.nodes.map((n) => n.id)).toEqual(['A', 'B', 'C'])
    expect(g.edges).toHaveLength(3)
  })

  it('lets a later labeled reference upgrade an earlier bare one', () => {
    const g = parseMermaid('graph TD\nA --> B\nA[Web App]')
    expect(g.nodes.find((n) => n.id === 'A')).toMatchObject({ label: 'Web App', shape: 'rect' })
  })

  it('strips surrounding quotes from a label', () => {
    const g = parseMermaid('graph TD\nA["Hello, World"]')
    expect(g.nodes[0].label).toBe('Hello, World')
  })
})

describe('parseMermaid — edge variants', () => {
  it('parses open links and arrowheads alike', () => {
    expect(parseMermaid('graph TD\nA --- B').edges).toEqual([{ source: 'A', target: 'B', label: '' }])
    expect(parseMermaid('graph TD\nA -.-> B').edges).toEqual([{ source: 'A', target: 'B', label: '' }])
    expect(parseMermaid('graph TD\nA ==> B').edges).toEqual([{ source: 'A', target: 'B', label: '' }])
  })

  it('reads a pipe edge label', () => {
    expect(parseMermaid('graph TD\nA -->|yes| B').edges[0].label).toBe('yes')
  })

  it('reads an inline edge label', () => {
    expect(parseMermaid('graph TD\nA -- no --> B').edges[0].label).toBe('no')
  })

  it('expands a chained statement into separate edges', () => {
    const g = parseMermaid('graph TD\nA --> B --> C')
    expect(g.edges).toEqual([
      { source: 'A', target: 'B', label: '' },
      { source: 'B', target: 'C', label: '' },
    ])
  })
})

describe('parseMermaid — noise tolerance', () => {
  it('ignores comments, blank lines, and styling directives', () => {
    const g = parseMermaid(`graph TD
      %% this is a comment
      A --> B

      style A fill:#f9f
      classDef big font-size:20px
      click A "https://example.com"`)
    expect(g.nodes.map((n) => n.id)).toEqual(['A', 'B'])
    expect(g.edges).toHaveLength(1)
  })

  it('flattens subgraph blocks for v1 (keeps the nodes, drops the grouping)', () => {
    const g = parseMermaid(`graph TD
      subgraph Cluster
        A --> B
      end
      B --> C`)
    expect(g.nodes.map((n) => n.id)).toEqual(['A', 'B', 'C'])
    expect(g.edges).toHaveLength(2)
  })
})
