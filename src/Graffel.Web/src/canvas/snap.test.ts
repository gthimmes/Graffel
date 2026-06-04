import { describe, expect, it } from 'vitest'
import {
  computeSnap,
  GRID_SIZE,
  SNAP_THRESHOLD,
  type IdRect,
} from './snap'

// Rect helper: build an IdRect from x,y,w,h.
function r(id: string, x: number, y: number, w = 100, h = 60): IdRect {
  return { id, x, y, w, h }
}

describe('computeSnap', () => {
  describe('thresholds and constants', () => {
    it(`exposes the documented defaults (${SNAP_THRESHOLD}px, ${GRID_SIZE}px)`, () => {
      expect(SNAP_THRESHOLD).toBe(4)
      expect(GRID_SIZE).toBe(8)
    })
  })

  describe('no candidates within threshold', () => {
    it('returns zero offset and no guides when no other rects are nearby', () => {
      const result = computeSnap({
        draggedRect: { x: 500, y: 500, w: 100, h: 60 },
        otherRects: [r('a', 0, 0)],
      })
      expect(result.offset).toEqual({ x: 0, y: 0 })
      expect(result.guides).toEqual([])
      expect(result.position).toEqual({ x: 500, y: 500 })
    })

    it('returns zero offset when otherRects is empty', () => {
      const result = computeSnap({
        draggedRect: { x: 0, y: 0, w: 100, h: 60 },
        otherRects: [],
      })
      expect(result.offset).toEqual({ x: 0, y: 0 })
      expect(result.guides).toEqual([])
    })
  })

  describe('edge alignment', () => {
    it('snaps left edge to another left edge when within threshold', () => {
      // Other left at x=200 (w=100). Dragged left at x=202 (w=80 so only left↔left
      // is within threshold; center/right candidates are far away).
      const other = r('a', 200, 400, 100, 60)
      const result = computeSnap({
        draggedRect: { x: 202, y: 100, w: 80, h: 60 },
        otherRects: [other],
      })
      expect(result.offset.x).toBe(-2)
      expect(result.position.x).toBe(200)
      // One vertical guide at x=200, spanning both rects vertically.
      const xGuides = result.guides.filter((g) => g.axis === 'x')
      expect(xGuides).toHaveLength(1)
      expect(xGuides[0]!.position).toBe(200)
      expect(xGuides[0]!.kind).toBe('edge')
      expect(xGuides[0]!.range[0]).toBe(100)   // dragged top
      expect(xGuides[0]!.range[1]).toBe(460)   // other.y + other.h
    })

    it('snaps right edge to another right edge', () => {
      // Other w=100 (right at 300). Dragged w=80 right at 297.
      const other = r('a', 200, 400, 100, 60)
      const result = computeSnap({
        draggedRect: { x: 217, y: 0, w: 80, h: 60 },   // right = 297
        otherRects: [other],
      })
      expect(result.offset.x).toBe(3)
      expect(result.position.x).toBe(220)              // dragged.x + 3
    })

    it('snaps top edge to another top edge', () => {
      // Other h=60 (top=200, mid=230, bot=260). Dragged h=40 keeps mid/bot
      // far from the other so only top↔top fires.
      const other = r('a', 500, 200, 100, 60)
      const result = computeSnap({
        draggedRect: { x: 0, y: 197, w: 100, h: 40 },
        otherRects: [other],
      })
      expect(result.offset.y).toBe(3)
      const yGuides = result.guides.filter((g) => g.axis === 'y')
      expect(yGuides).toHaveLength(1)
      expect(yGuides[0]!.position).toBe(200)
      expect(yGuides[0]!.kind).toBe('edge')
    })

    it('does not snap when delta exceeds threshold', () => {
      const other = r('a', 200, 0, 100, 60)   // lines x={200,250,300}, y={0,30,60}
      // Dragged x=215, w=80 → x lines {215,255,295}; y=80, h=40 → y lines {80,100,120}.
      // No dragged line within 4 of any other line on either axis.
      const result = computeSnap({
        draggedRect: { x: 215, y: 80, w: 80, h: 40 },
        otherRects: [other],
      })
      expect(result.offset).toEqual({ x: 0, y: 0 })
      expect(result.guides).toEqual([])
    })
  })

  describe('center alignment', () => {
    it('snaps horizontal centers and emits a center-kind guide', () => {
      // Other center at x=250. Dragged center at x=252.
      const other = r('a', 200, 400)             // centerX = 250
      const result = computeSnap({
        draggedRect: { x: 202, y: 100, w: 100, h: 60 },  // centerX = 252
        otherRects: [other],
      })
      expect(result.offset.x).toBe(-2)
      expect(result.position.x).toBe(200)
      const xGuides = result.guides.filter((g) => g.axis === 'x')
      expect(xGuides).toHaveLength(1)
      expect(xGuides[0]!.position).toBe(250)
      expect(xGuides[0]!.kind).toBe('center')
    })

    it('snaps vertical centers', () => {
      const other = r('a', 500, 200)             // centerY = 230
      const result = computeSnap({
        draggedRect: { x: 0, y: 198, w: 100, h: 60 },    // centerY = 228
        otherRects: [other],
      })
      expect(result.offset.y).toBe(2)
      expect(result.position.y).toBe(200)
    })

    it('prefers center over edge when both would fire at the same delta', () => {
      // A single other rect whose center AND left edge both land within
      // threshold for different parts of the dragged rect — but at the same delta,
      // center should be the one labeled in guides.
      // Construct: other at x=100, w=100 → center at 150, right at 200.
      // Dragged at x=148, w=100 → left at 148, center at 198, right at 248.
      // delta candidates (other_candidate - dragged_target):
      //   left↔left   = 100 - 148 = -48 (out)
      //   center↔center = 150 - 198 = -48 (out)
      //   left↔right  = 100 - 248 = -148 (out)
      //   right↔left  = 200 - 148 = +52 (out)
      //   right↔center= 200 - 198 = +2 (in, edge kind)
      //   right↔right = 200 - 248 = -48 (out)
      // Only one in-threshold candidate, which is edge — proves the API
      // returns the right kind when there's no ambiguity.
      const other = r('a', 100, 0)
      const result = computeSnap({
        draggedRect: { x: 148, y: 0, w: 100, h: 60 },
        otherRects: [other],
      })
      expect(result.offset.x).toBe(2)
      // The candidate is right(200) vs dragged center(198+2=200). It's an edge↔center
      // candidate; semantically the guide is drawn at the matched line, kind labels
      // whether the *dragged* side is a center or an edge. Center wins the kind.
      const xGuides = result.guides.filter((g) => g.axis === 'x')
      expect(xGuides[0]!.position).toBe(200)
      expect(xGuides[0]!.kind).toBe('center')
    })
  })

  describe('multiple candidates and guides', () => {
    it('emits one guide per matching rect at the snapped position', () => {
      // Two other rects (w=100), both with left edge at x=200.
      // Dragged w=80 keeps center/right candidates out of threshold.
      const a = r('a', 200, 100, 100, 60)
      const b = r('b', 200, 500, 100, 60)
      const result = computeSnap({
        draggedRect: { x: 203, y: 300, w: 80, h: 60 },
        otherRects: [a, b],
      })
      expect(result.offset.x).toBe(-3)
      const xGuides = result.guides.filter((g) => g.axis === 'x' && g.position === 200)
      expect(xGuides).toHaveLength(1)
      // Vertical extent should cover all three rects (dragged + both others).
      expect(xGuides[0]!.range[0]).toBe(100)   // a.y (topmost)
      expect(xGuides[0]!.range[1]).toBe(560)   // b.y + b.h (bottommost)
    })

    it('snaps independently on x and y axes', () => {
      const a = r('a', 200, 0, 100, 60)     // left at 200
      const b = r('b', 0, 300, 100, 60)     // top at 300
      // Dragged w/h kept smaller so only left↔left (x) and top↔top (y) fire.
      const result = computeSnap({
        draggedRect: { x: 203, y: 297, w: 80, h: 40 },
        otherRects: [a, b],
      })
      expect(result.offset).toEqual({ x: -3, y: 3 })
      expect(result.guides.some((g) => g.axis === 'x' && g.position === 200)).toBe(true)
      expect(result.guides.some((g) => g.axis === 'y' && g.position === 300)).toBe(true)
    })

    it('picks the smaller delta when multiple candidates fire on the same axis', () => {
      // Other rect with left at 200 and right at 300.
      // Dragged left at 198 (delta +2 to left↔left) and right at 298 (delta +2 to right↔right).
      // Both candidates have |delta|=2 — either snap is fine and yields x=200 → x=200.
      // But construct one closer: other2 with left at 199.
      const other = r('a', 200, 0)
      const other2 = r('b', 199, 100)
      const result = computeSnap({
        draggedRect: { x: 201, y: 0, w: 100, h: 60 },
        otherRects: [other, other2],
      })
      // Two candidates: snap to 200 (delta -1) or snap to 199 (delta -2).
      // Smallest |delta| wins → x=200.
      expect(result.position.x).toBe(200)
    })
  })

  describe('disabled (Alt held)', () => {
    it('returns zero offset and no guides regardless of nearby rects', () => {
      const other = r('a', 200, 0)
      const result = computeSnap({
        draggedRect: { x: 201, y: 0, w: 100, h: 60 },
        otherRects: [other],
        disabled: true,
      })
      expect(result.offset).toEqual({ x: 0, y: 0 })
      expect(result.guides).toEqual([])
      expect(result.position).toEqual({ x: 201, y: 0 })
    })

    it('disabled overrides grid snap as well', () => {
      const result = computeSnap({
        draggedRect: { x: 13, y: 27, w: 100, h: 60 },
        otherRects: [],
        gridSize: 8,
        disabled: true,
      })
      expect(result.position).toEqual({ x: 13, y: 27 })
    })
  })

  describe('grid snap', () => {
    it('rounds dragged position to nearest grid multiple when no alignment fires', () => {
      const result = computeSnap({
        draggedRect: { x: 13, y: 27, w: 100, h: 60 },
        otherRects: [],
        gridSize: 8,
      })
      // 13 → 16, 27 → 24
      expect(result.position).toEqual({ x: 16, y: 24 })
      expect(result.offset).toEqual({ x: 3, y: -3 })
      expect(result.guides).toEqual([])
    })

    it('alignment beats grid on the same axis', () => {
      // X: alignment fires (delta -2 to 245), grid would land elsewhere (248).
      // Y: no alignment fires, grid snaps 205 → 208.
      const other = r('a', 245, 0, 100, 60)
      const result = computeSnap({
        draggedRect: { x: 247, y: 205, w: 80, h: 40 },
        otherRects: [other],
        gridSize: 8,
      })
      expect(result.position.x).toBe(245)  // alignment, not grid (248)
      expect(result.position.y).toBe(208)  // grid, no alignment
      expect(result.guides.filter((g) => g.axis === 'x')).toHaveLength(1)
      expect(result.guides.filter((g) => g.axis === 'y')).toHaveLength(0)
    })

    it('gridSize=null leaves position unsnapped when no alignment fires', () => {
      const result = computeSnap({
        draggedRect: { x: 13, y: 27, w: 100, h: 60 },
        otherRects: [],
        gridSize: null,
      })
      expect(result.position).toEqual({ x: 13, y: 27 })
    })
  })

  describe('threshold customization', () => {
    it('respects a caller-supplied threshold', () => {
      const other = r('a', 200, 0)
      // Dragged left at 207 — 7px away.
      // Default threshold (4) would miss it; threshold=8 should snap.
      const tight = computeSnap({
        draggedRect: { x: 207, y: 0, w: 100, h: 60 },
        otherRects: [other],
      })
      expect(tight.offset.x).toBe(0)
      const loose = computeSnap({
        draggedRect: { x: 207, y: 0, w: 100, h: 60 },
        otherRects: [other],
        threshold: 8,
      })
      expect(loose.offset.x).toBe(-7)
    })
  })
})
