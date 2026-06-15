import { describe, expect, it } from 'vitest'
import {
  buildWaypointPath,
  fractionAtPoint,
  pathLength,
  pointAtFraction,
  segmentMidpoints,
  snapToGrid,
  WAYPOINT_GRID,
} from './waypointPath'

describe('waypointPath', () => {
  describe('buildWaypointPath', () => {
    it('emits a straight line when there are no waypoints', () => {
      const d = buildWaypointPath({ x: 0, y: 0 }, [], { x: 100, y: 50 })
      expect(d).toBe('M 0,0 L 100,50')
    })

    it('emits L commands between each waypoint', () => {
      const d = buildWaypointPath(
        { x: 0, y: 0 },
        [{ x: 50, y: 0 }, { x: 50, y: 50 }],
        { x: 100, y: 50 },
      )
      expect(d).toBe('M 0,0 L 50,0 L 50,50 L 100,50')
    })
  })

  describe('segmentMidpoints', () => {
    it('returns one midpoint per segment, indexed by segment', () => {
      const mids = segmentMidpoints(
        { x: 0, y: 0 },
        [{ x: 100, y: 0 }],
        { x: 200, y: 0 },
      )
      expect(mids).toEqual([
        { x: 50,  y: 0, segmentIndex: 0 },
        { x: 150, y: 0, segmentIndex: 1 },
      ])
    })

    it('handles zero waypoints by emitting one midpoint at the segment center', () => {
      const mids = segmentMidpoints({ x: 0, y: 0 }, [], { x: 100, y: 100 })
      expect(mids).toEqual([{ x: 50, y: 50, segmentIndex: 0 }])
    })
  })

  describe('pathLength', () => {
    it('sums the segment lengths', () => {
      expect(pathLength([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }])).toBe(70)
    })
    it('is zero for a single point', () => {
      expect(pathLength([{ x: 5, y: 5 }])).toBe(0)
    })
  })

  describe('pointAtFraction', () => {
    const L = [{ x: 0, y: 0 }, { x: 100, y: 0 }]
    it('returns the midpoint at t=0.5', () => {
      expect(pointAtFraction(L, 0.5)).toEqual({ x: 50, y: 0 })
    })
    it('clamps to the endpoints', () => {
      expect(pointAtFraction(L, 0)).toEqual({ x: 0, y: 0 })
      expect(pointAtFraction(L, 1)).toEqual({ x: 100, y: 0 })
      expect(pointAtFraction(L, 2)).toEqual({ x: 100, y: 0 })
    })
    it('measures by arc length across multiple segments', () => {
      // total length 70; t=0.5 -> 35 along: 30 on seg1 then 5 up seg2.
      const p = pointAtFraction([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }], 0.5)
      expect(p).toEqual({ x: 30, y: 5 })
    })
  })

  describe('fractionAtPoint', () => {
    const L = [{ x: 0, y: 0 }, { x: 100, y: 0 }]
    it('finds the nearest fraction along the line', () => {
      expect(fractionAtPoint(L, { x: 25, y: 10 })).toBeCloseTo(0.25, 5)
    })
    it('clamps a point past the end to 1', () => {
      expect(fractionAtPoint(L, { x: 250, y: 0 })).toBeCloseTo(1, 5)
    })
  })

  describe('snapToGrid', () => {
    it(`snaps to the ${WAYPOINT_GRID}px grid`, () => {
      expect(snapToGrid({ x: 13, y: 27 })).toEqual({ x: 16, y: 24 })
      expect(snapToGrid({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
      expect(snapToGrid({ x: -3, y: -5 })).toEqual({ x: 0, y: -8 })
    })
  })
})
