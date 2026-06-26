import { beforeEach, describe, expect, it } from 'vitest'
import { exportCurrentLevelMermaid } from './importMermaid'
import { useDiagramStore } from '../../store/diagramStore'
import { createEmptyDocument } from '../graffelFile'
import type { GraffelEdge, GraffelNode } from '../types'

function node(id: string, type: string, label: string, parentId: string | null = null): GraffelNode {
  return { id, type, parentId, position: { x: 0, y: 0 }, size: { w: 160, h: 80 }, data: { label } }
}
function edge(id: string, source: string, target: string): GraffelEdge {
  return { id, source, target, sourceHandle: 'right', targetHandle: 'left', type: 'orthogonal', data: { label: '' } }
}

function load(nodes: GraffelNode[], edges: GraffelEdge[]) {
  const doc = createEmptyDocument()
  doc.nodes = nodes
  doc.edges = edges
  useDiagramStore.getState().loadDocument(doc)
}

describe('exportCurrentLevelMermaid', () => {
  beforeEach(() => useDiagramStore.getState().reset())

  it('serializes the root level of the current document', () => {
    load([node('a', 'basic:rectangle', 'Web'), node('b', 'basic:diamond', 'Auth')], [edge('e1', 'a', 'b')])
    const out = exportCurrentLevelMermaid()
    expect(out).toMatch(/^graph TD/)
    expect(out).toContain('["Web"]')
    expect(out).toContain('{"Auth"}')
    expect(out).toContain('-->')
  })

  it('exports the full hierarchy from root, containers as subgraphs', () => {
    load(
      [
        node('box', 'basic:group', 'Box'),
        node('inner', 'basic:rectangle', 'Inner', 'box'),
        node('top', 'basic:rectangle', 'Top'),
      ],
      [],
    )
    const out = exportCurrentLevelMermaid()
    expect(out).toContain('subgraph')
    expect(out).toContain('"Box"')
    expect(out).toContain('"Inner"') // nested inside the Box subgraph
    expect(out).toContain('"Top"')
  })

  it('exports just the subtree when drilled into a container', () => {
    load(
      [
        node('box', 'basic:group', 'Box'),
        node('inner', 'basic:rectangle', 'Inner', 'box'),
        node('top', 'basic:rectangle', 'Top'),
      ],
      [],
    )
    useDiagramStore.setState({ viewRootId: 'box' })
    const inside = exportCurrentLevelMermaid()
    // Box's child is now top-level (no enclosing subgraph), Top is excluded.
    expect(inside).toContain('"Inner"')
    expect(inside).not.toContain('subgraph')
    expect(inside).not.toContain('"Top"')
  })
})
