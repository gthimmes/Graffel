import { describe, expect, it } from 'vitest'
import { isHandleSide, toReactFlowEdge, toReactFlowNode } from './adapters'
import type { GraffelEdge, GraffelNode } from '../format/types'

function node(id: string, parentId: string | null = null): GraffelNode {
  return {
    id,
    type: 'basic:rectangle',
    parentId,
    position: { x: 10, y: 20 },
    size: { w: 100, h: 50 },
    data: { label: '' },
  }
}

describe('toReactFlowNode parent/child', () => {
  it('omits parentId/extent for a top-level node', () => {
    const rf = toReactFlowNode(node('a'))
    expect(rf.parentId).toBeUndefined()
    expect(rf.extent).toBeUndefined()
  })

  it('passes parentId through (no extent, so children can be dragged out)', () => {
    const rf = toReactFlowNode(node('child', 'parent'))
    expect(rf.parentId).toBe('parent')
    expect(rf.extent).toBeUndefined()
    // Position stays relative — RF derives the absolute position from the parent.
    expect(rf.position).toEqual({ x: 10, y: 20 })
  })

  it('carries the label, shapeId, size and style into node.data', () => {
    const n = { ...node('a'), type: 'arch-core:database', data: { label: 'DB', style: { fill: 'red' } } }
    const rf = toReactFlowNode(n)
    expect(rf.data).toMatchObject({ label: 'DB', shapeId: 'arch-core:database', width: 100, height: 50, style: { fill: 'red' } })
  })
})

function edge(partial: Partial<GraffelEdge> = {}): GraffelEdge {
  return {
    id: 'e1', source: 'a', target: 'b',
    sourceHandle: 'right', targetHandle: 'left',
    type: 'orthogonal', data: { label: '' },
    ...partial,
  }
}

describe('toReactFlowEdge', () => {
  it('maps the core fields and always uses the custom waypoint edge', () => {
    const rf = toReactFlowEdge(edge())
    expect(rf).toMatchObject({ id: 'e1', source: 'a', target: 'b', type: 'waypoint' })
    expect(rf.data).toMatchObject({ routingMode: 'orthogonal', waypoints: [] })
  })

  it('drops an empty label but keeps a real one', () => {
    expect(toReactFlowEdge(edge()).label).toBeUndefined()
    expect(toReactFlowEdge(edge({ data: { label: 'calls' } })).label).toBe('calls')
  })

  it('translates a null handle to undefined', () => {
    const rf = toReactFlowEdge(edge({ sourceHandle: null, targetHandle: null }))
    expect(rf.sourceHandle).toBeUndefined()
    expect(rf.targetHandle).toBeUndefined()
  })

  it('applies stroke style + dash pattern and resolves end markers', () => {
    const rf = toReactFlowEdge(edge({
      data: { label: '', style: { strokeColor: '#f00', strokeWidth: 3, strokeStyle: 'dashed', markerEnd: 'arrow', markerStart: 'none' } },
    }))
    expect(rf.style).toMatchObject({ stroke: '#f00', strokeWidth: 3, strokeDasharray: '8 4' })
    expect(rf.markerEnd).toBeTruthy()      // 'arrow' resolves to a marker ref
    expect(rf.markerStart).toBeUndefined() // 'none' resolves to nothing
  })

  it('carries waypoints and labelT through', () => {
    const rf = toReactFlowEdge(edge({ data: { label: '', waypoints: [{ x: 1, y: 2 }], labelT: 0.3 } }))
    expect(rf.data).toMatchObject({ waypoints: [{ x: 1, y: 2 }], labelT: 0.3 })
  })
})

describe('isHandleSide', () => {
  it('accepts the four sides and rejects anything else', () => {
    for (const s of ['top', 'right', 'bottom', 'left']) expect(isHandleSide(s)).toBe(true)
    expect(isHandleSide('middle')).toBe(false)
    expect(isHandleSide(null)).toBe(false)
    expect(isHandleSide(undefined)).toBe(false)
  })
})
