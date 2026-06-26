// Turn a parsed Mermaid graph into Graffel nodes + edges. Pure and unit-tested.
//
// Positions are left at the origin here; layout is a separate ELK pass in
// importMermaid (kept out of this pure module so it stays synchronous + testable).

import type { GraffelEdge, GraffelNode, HandleSide } from '../types'
import { getShape } from '../../shapes/registry'
import type { MermaidGraph, MermaidShape } from './parseMermaid'

const FALLBACK_SIZE = { w: 160, h: 80 }

const SHAPE_ID: Record<MermaidShape, string> = {
  rect: 'basic:rectangle',
  round: 'basic:rectangle',
  stadium: 'basic:rectangle',
  diamond: 'basic:diamond',
  circle: 'basic:ellipse',
  cylinder: 'arch-core:database',
}

export function buildGraph(graph: MermaidGraph): { nodes: GraffelNode[]; edges: GraffelEdge[] } {
  const nodes: GraffelNode[] = graph.nodes.map((m) => {
    const type = SHAPE_ID[m.shape] ?? 'basic:rectangle'
    const size = getShape(type)?.defaultSize ?? FALLBACK_SIZE
    return {
      id: m.id,
      type,
      parentId: null,
      position: { x: 0, y: 0 },
      size: { ...size },
      data: { label: m.label },
    }
  })

  // Handles follow the primary flow direction so the orthogonal routing reads
  // cleanly the moment the import lands (before any manual editing).
  const sourceHandle: HandleSide = graph.direction === 'RIGHT' ? 'right' : 'bottom'
  const targetHandle: HandleSide = graph.direction === 'RIGHT' ? 'left' : 'top'

  const edges: GraffelEdge[] = graph.edges.map((e, i) => ({
    id: `me_${i}`,
    source: e.source,
    target: e.target,
    sourceHandle,
    targetHandle,
    type: 'orthogonal',
    data: { label: e.label },
  }))

  return { nodes, edges }
}
