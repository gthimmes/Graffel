import { describe, expect, it } from 'vitest'
import { routeOrthogonal, segmentCrossesRect, type Rect } from './orthogonalRoute'
import type { Point } from './floating'

function isOrthogonal(path: Point[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!, b = path[i + 1]!
    if (a.x !== b.x && a.y !== b.y) return false
  }
  return true
}
function bends(path: Point[]): number {
  let n = 0
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1]!, b = path[i]!, c = path[i + 1]!
    const d1 = a.x === b.x ? 'V' : 'H'
    const d2 = b.x === c.x ? 'V' : 'H'
    if (d1 !== d2) n++
  }
  return n
}
function crossesAny(path: Point[], obstacles: Rect[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    for (const o of obstacles) {
      if (segmentCrossesRect(path[i]!, path[i + 1]!, o)) return true
    }
  }
  return false
}

describe('segmentCrossesRect', () => {
  const r: Rect = { x: 100, y: 100, width: 100, height: 100 } // 100..200 both axes

  it('a horizontal segment through the interior crosses', () => {
    expect(segmentCrossesRect({ x: 0, y: 150 }, { x: 300, y: 150 }, r)).toBe(true)
  })
  it('a horizontal segment grazing the top edge does NOT cross', () => {
    expect(segmentCrossesRect({ x: 0, y: 100 }, { x: 300, y: 100 }, r)).toBe(false)
  })
  it('a horizontal segment clear of the rect does NOT cross', () => {
    expect(segmentCrossesRect({ x: 0, y: 50 }, { x: 300, y: 50 }, r)).toBe(false)
  })
  it('a vertical segment through the interior crosses', () => {
    expect(segmentCrossesRect({ x: 150, y: 0 }, { x: 150, y: 300 }, r)).toBe(true)
  })
  it('a segment ending before the rect does NOT cross', () => {
    expect(segmentCrossesRect({ x: 0, y: 150 }, { x: 100, y: 150 }, r)).toBe(false)
  })
})

describe('routeOrthogonal', () => {
  it('returns a straight 2-point path for aligned points with no obstacles', () => {
    const p = routeOrthogonal({ x: 0, y: 50 }, { x: 200, y: 50 }, [])!
    expect(p[0]).toEqual({ x: 0, y: 50 })
    expect(p[p.length - 1]).toEqual({ x: 200, y: 50 })
    expect(bends(p)).toBe(0)
  })

  it('returns a single-bend L for offset points with no obstacles', () => {
    const p = routeOrthogonal({ x: 0, y: 0 }, { x: 200, y: 100 }, [])!
    expect(p[0]).toEqual({ x: 0, y: 0 })
    expect(p[p.length - 1]).toEqual({ x: 200, y: 100 })
    expect(isOrthogonal(p)).toBe(true)
    expect(bends(p)).toBe(1)
  })

  it('routes around an obstacle that blocks the direct line', () => {
    // Source left, target right, a box squarely on the y=50 line between them.
    const obstacle: Rect = { x: 80, y: 0, width: 40, height: 100 } // x80..120, y0..100
    const p = routeOrthogonal({ x: 0, y: 50 }, { x: 200, y: 50 }, [obstacle])!
    expect(p[0]).toEqual({ x: 0, y: 50 })
    expect(p[p.length - 1]).toEqual({ x: 200, y: 50 })
    expect(isOrthogonal(p)).toBe(true)
    // The path must detour — at least two bends — and never cross the obstacle.
    expect(bends(p)).toBeGreaterThanOrEqual(2)
    expect(crossesAny(p, [obstacle])).toBe(false)
  })

  it('keeps a margin of clearance around obstacles', () => {
    const obstacle: Rect = { x: 80, y: 0, width: 40, height: 100 }
    const p = routeOrthogonal({ x: 0, y: 50 }, { x: 200, y: 50 }, [obstacle], { margin: 12 })!
    // The detour leg should clear the inflated obstacle, i.e. run above y=-12 or below y=112.
    const inflated: Rect = { x: 68, y: -12, width: 64, height: 124 }
    expect(crossesAny(p, [inflated])).toBe(false)
  })

  it('returns null when the source is boxed in (no route) so callers can fall back', () => {
    // Obstacle fully surrounding-ish the source on the only escape lines.
    const boxIn: Rect = { x: -5, y: -5, width: 10, height: 10 }
    const p = routeOrthogonal({ x: 0, y: 0 }, { x: 200, y: 0 }, [boxIn], { margin: 0 })
    // Source sits inside this obstacle's interior -> no clean exit.
    expect(p).toBeNull()
  })

  it('collapses collinear points so paths stay minimal', () => {
    const p = routeOrthogonal({ x: 0, y: 0 }, { x: 300, y: 0 }, [])!
    // A straight run must not contain redundant midpoints.
    expect(p.length).toBe(2)
  })
})
