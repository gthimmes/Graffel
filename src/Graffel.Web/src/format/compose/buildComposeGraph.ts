// Turn a parsed ComposeModel into Graffel nodes + edges. Pure and unit-tested.
//
// Positions are left at the origin; layout is a separate ELK pass in
// importCompose (kept out of this pure module so it stays synchronous + testable).
//
// Ids are DERIVED FROM THE SOURCE (`compose:<service>`, `ce:<a>__<b>`) rather than
// random — that stable identity is what lets a later re-sync (ADR-0016, slice 2)
// match a regenerated graph against your hand-edited diagram instead of replacing it.

import type { GraffelEdge, GraffelNode, HandleSide } from '../types'
import { getShape } from '../../shapes/registry'
import { inferShapeId } from './inferShape'
import type { ComposeModel } from './parseCompose'

const FALLBACK_SIZE = { w: 160, h: 80 }

/** Stable node id for a compose service. */
export function composeNodeId(service: string): string {
  return `compose:${service}`
}

/** Stable edge id for a depends_on relationship. */
export function composeEdgeId(from: string, to: string): string {
  return `ce:${from}__${to}`
}

export function buildComposeGraph(model: ComposeModel): { nodes: GraffelNode[]; edges: GraffelEdge[] } {
  const known = new Set(model.services.map((s) => s.name))

  const nodes: GraffelNode[] = model.services.map((s) => {
    const type = inferShapeId(s)
    const size = getShape(type)?.defaultSize ?? FALLBACK_SIZE
    return {
      id: composeNodeId(s.name),
      type,
      parentId: null,
      position: { x: 0, y: 0 },
      size: { ...size },
      data: { label: s.name },
    }
  })

  // depends_on reads "this service needs that one", so the call arrow points from
  // the dependent to its dependency. Handles follow a left→right flow so routing
  // reads cleanly before any manual editing.
  const sourceHandle: HandleSide = 'right'
  const targetHandle: HandleSide = 'left'

  const edges: GraffelEdge[] = []
  for (const s of model.services) {
    for (const dep of s.dependsOn) {
      if (!known.has(dep)) continue // dangling depends_on — skip rather than invent a node
      edges.push({
        id: composeEdgeId(s.name, dep),
        source: composeNodeId(s.name),
        target: composeNodeId(dep),
        sourceHandle,
        targetHandle,
        type: 'orthogonal',
        data: { label: '' },
      })
    }
  }

  return { nodes, edges }
}
