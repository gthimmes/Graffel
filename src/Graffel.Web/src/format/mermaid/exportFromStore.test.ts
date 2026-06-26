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

  it('exports only the level currently in view (drill-down respected)', () => {
    load(
      [
        node('box', 'basic:group', 'Box'),
        node('inner', 'basic:rectangle', 'Inner', 'box'),
        node('top', 'basic:rectangle', 'Top'),
      ],
      [],
    )
    // At root: see Box + Top, not Inner.
    expect(exportCurrentLevelMermaid()).toContain('"Box"')
    expect(exportCurrentLevelMermaid()).toContain('"Top"')
    expect(exportCurrentLevelMermaid()).not.toContain('"Inner"')
    // Drill into Box: see Inner only.
    useDiagramStore.setState({ viewRootId: 'box' })
    const inside = exportCurrentLevelMermaid()
    expect(inside).toContain('"Inner"')
    expect(inside).not.toContain('"Top"')
  })
})
