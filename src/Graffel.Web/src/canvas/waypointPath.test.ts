import { describe, expect, it } from 'vitest'
import {
  buildWaypointPath,
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

  describe('snapToGrid', () => {
    it(`snaps to the ${WAYPOINT_GRID}px grid`, () => {
      expect(snapToGrid({ x: 13, y: 27 })).toEqual({ x: 16, y: 24 })
      expect(snapToGrid({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
      expect(snapToGrid({ x: -3, y: -5 })).toEqual({ x: 0, y: -8 })
    })
  })
})
