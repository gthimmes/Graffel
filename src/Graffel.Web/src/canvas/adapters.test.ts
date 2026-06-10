import { describe, expect, it } from 'vitest'
import { toReactFlowNode } from './adapters'
import type { GraffelNode } from '../format/types'

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
})
