import { describe, expect, it } from 'vitest'
import type { GraffelNode } from '../format/types'
import {
  absolutePosition,
  absoluteRect,
  descendantIds,
  indexNodes,
  innermostContainerAt,
  sortNodesByDepth,
  toAbsolute,
  toRelative,
} from './nesting'

function node(
  id: string,
  position: { x: number; y: number },
  size: { w: number; h: number },
  parentId: string | null = null,
): GraffelNode {
  return { id, type: 'basic:rectangle', parentId, position, size, data: { label: '' } }
}

describe('nesting helpers', () => {
  describe('absolutePosition / absoluteRect', () => {
    it('returns position as-is for a top-level node', () => {
      const n = node('a', { x: 30, y: 40 }, { w: 100, h: 50 })
      const byId = indexNodes([n])
      expect(absolutePosition(n, byId)).toEqual({ x: 30, y: 40 })
    })

    it('adds parent offsets through two levels of nesting', () => {
      const grandparent = node('gp', { x: 100, y: 200 }, { w: 400, h: 400 })
      const parent = node('p', { x: 10, y: 20 }, { w: 200, h: 200 }, 'gp')
      const child = node('c', { x: 5, y: 5 }, { w: 40, h: 40 }, 'p')
      const byId = indexNodes([grandparent, parent, child])
      // child abs = 100+10+5, 200+20+5
      expect(absolutePosition(child, byId)).toEqual({ x: 115, y: 225 })
      expect(absoluteRect(child, byId)).toEqual({ x: 115, y: 225, w: 40, h: 40 })
    })

    it('does not loop forever on a cyclic parentId', () => {
      const a = node('a', { x: 1, y: 1 }, { w: 10, h: 10 }, 'b')
      const b = node('b', { x: 2, y: 2 }, { w: 10, h: 10 }, 'a')
      const byId = indexNodes([a, b])
      // Just assert it terminates and returns a finite point.
      const p = absolutePosition(a, byId)
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
    })
  })

  describe('toRelative / toAbsolute', () => {
    it('round-trips a point through a parent frame', () => {
      const parentAbs = { x: 100, y: 80 }
      const abs = { x: 150, y: 130 }
      const rel = toRelative(abs, parentAbs)
      expect(rel).toEqual({ x: 50, y: 50 })
      expect(toAbsolute(rel, parentAbs)).toEqual(abs)
    })
  })

  describe('sortNodesByDepth', () => {
    it('orders parents before their children (React Flow requirement)', () => {
      // Intentionally list child before parent in the input.
      const child = node('c', { x: 0, y: 0 }, { w: 10, h: 10 }, 'p')
      const parent = node('p', { x: 0, y: 0 }, { w: 100, h: 100 })
      const sorted = sortNodesByDepth([child, parent])
      expect(sorted.map((n) => n.id)).toEqual(['p', 'c'])
    })

    it('is stable for nodes at the same depth', () => {
      const a = node('a', { x: 0, y: 0 }, { w: 10, h: 10 })
      const b = node('b', { x: 0, y: 0 }, { w: 10, h: 10 })
      expect(sortNodesByDepth([a, b]).map((n) => n.id)).toEqual(['a', 'b'])
    })
  })

  describe('descendantIds', () => {
    it('collects children and grandchildren', () => {
      const p = node('p', { x: 0, y: 0 }, { w: 100, h: 100 })
      const c1 = node('c1', { x: 0, y: 0 }, { w: 10, h: 10 }, 'p')
      const c2 = node('c2', { x: 0, y: 0 }, { w: 10, h: 10 }, 'p')
      const gc = node('gc', { x: 0, y: 0 }, { w: 5, h: 5 }, 'c1')
      const ids = descendantIds('p', [p, c1, c2, gc])
      expect(ids).toEqual(new Set(['c1', 'c2', 'gc']))
    })
  })

  describe('innermostContainerAt', () => {
    const isContainer = (n: GraffelNode) => n.type === 'basic:group'

    it('returns the smallest container whose box contains the rect center', () => {
      const outer = { ...node('outer', { x: 0, y: 0 }, { w: 400, h: 400 }), type: 'basic:group' }
      const inner = { ...node('inner', { x: 50, y: 50 }, { w: 200, h: 200 }), type: 'basic:group' }
      const dragged = node('d', { x: 100, y: 100 }, { w: 20, h: 20 })
      const nodes = [outer, inner, dragged]
      const byId = indexNodes(nodes)
      const hit = innermostContainerAt(absoluteRect(dragged, byId), nodes, byId, {
        isContainer,
        excludeIds: new Set(['d']),
      })
      expect(hit?.id).toBe('inner')
    })

    it('ignores non-container nodes', () => {
      const plain = node('plain', { x: 0, y: 0 }, { w: 400, h: 400 }) // basic:rectangle
      const dragged = node('d', { x: 100, y: 100 }, { w: 20, h: 20 })
      const nodes = [plain, dragged]
      const byId = indexNodes(nodes)
      const hit = innermostContainerAt(absoluteRect(dragged, byId), nodes, byId, {
        isContainer,
        excludeIds: new Set(['d']),
      })
      expect(hit).toBeNull()
    })

    it('excludes the node itself and its descendants (no self-nesting)', () => {
      const box = { ...node('box', { x: 0, y: 0 }, { w: 400, h: 400 }), type: 'basic:group' }
      const child = { ...node('child', { x: 10, y: 10 }, { w: 100, h: 100 }, 'box'), type: 'basic:group' }
      const nodes = [box, child]
      const byId = indexNodes(nodes)
      // Dragging `box` — its own rect center sits over itself and over `child`,
      // but both must be excluded.
      const hit = innermostContainerAt(absoluteRect(box, byId), nodes, byId, {
        isContainer,
        excludeIds: new Set(['box', 'child']),
      })
      expect(hit).toBeNull()
    })
  })
})
