import { describe, expect, it } from 'vitest'
import { chooseSides, rectCenter, rectPerimeterPoint, floatingEndpoints, type Rect } from './floating'

const A: Rect = { x: 0, y: 0, width: 100, height: 100 } // center (50,50)

describe('rectCenter', () => {
  it('returns the geometric center', () => {
    expect(rectCenter(A)).toEqual({ x: 50, y: 50 })
    expect(rectCenter({ x: 10, y: 20, width: 40, height: 60 })).toEqual({ x: 30, y: 50 })
  })
})

describe('rectPerimeterPoint', () => {
  it('hits the right edge when the target is directly to the right', () => {
    const r = rectPerimeterPoint(A, { x: 500, y: 50 })
    expect(r.point).toEqual({ x: 100, y: 50 })
    expect(r.side).toBe('right')
  })

  it('hits the left edge when the target is directly to the left', () => {
    const r = rectPerimeterPoint(A, { x: -500, y: 50 })
    expect(r.point).toEqual({ x: 0, y: 50 })
    expect(r.side).toBe('left')
  })

  it('hits the top edge when the target is directly above', () => {
    const r = rectPerimeterPoint(A, { x: 50, y: -500 })
    expect(r.point).toEqual({ x: 50, y: 0 })
    expect(r.side).toBe('top')
  })

  it('hits the bottom edge when the target is directly below', () => {
    const r = rectPerimeterPoint(A, { x: 50, y: 500 })
    expect(r.point).toEqual({ x: 50, y: 100 })
    expect(r.side).toBe('bottom')
  })

  it('exits a corner along the diagonal', () => {
    // 45° toward bottom-right hits the corner (100,100).
    const r = rectPerimeterPoint(A, { x: 1050, y: 1050 })
    expect(r.point).toEqual({ x: 100, y: 100 })
  })

  it('returns the center for a degenerate (same-point) target', () => {
    const r = rectPerimeterPoint(A, { x: 50, y: 50 })
    expect(r.point).toEqual({ x: 50, y: 50 })
  })

  it('scales to the box aspect — wide box exits the side, not the corner', () => {
    // 200x100 box, center (100,50). Target up-and-right but shallow angle -> right edge.
    const wide: Rect = { x: 0, y: 0, width: 200, height: 100 }
    const r = rectPerimeterPoint(wide, { x: 1100, y: 100 })
    expect(r.side).toBe('right')
    expect(r.point.x).toBe(200)
  })
})

describe('floatingEndpoints', () => {
  it('attaches both ends along the line between the two centers', () => {
    const left: Rect = { x: 0, y: 0, width: 100, height: 100 }   // center (50,50)
    const right: Rect = { x: 300, y: 0, width: 100, height: 100 } // center (350,50)
    const r = floatingEndpoints(left, right)
    expect(r.source).toEqual({ x: 100, y: 50 }) // right edge of left box
    expect(r.target).toEqual({ x: 300, y: 50 }) // left edge of right box
    expect(r.sourceSide).toBe('right')
    expect(r.targetSide).toBe('left')
  })

  it('is symmetric for vertically stacked boxes', () => {
    const top: Rect = { x: 0, y: 0, width: 100, height: 100 }     // center (50,50)
    const bottom: Rect = { x: 0, y: 300, width: 100, height: 100 } // center (50,350)
    const r = floatingEndpoints(top, bottom)
    expect(r.source).toEqual({ x: 50, y: 100 })
    expect(r.target).toEqual({ x: 50, y: 300 })
    expect(r.sourceSide).toBe('bottom')
    expect(r.targetSide).toBe('top')
  })
})

describe('chooseSides', () => {
  it('picks the facing sides for a left→right layout', () => {
    const left: Rect = { x: 0, y: 0, width: 100, height: 100 }
    const right: Rect = { x: 300, y: 0, width: 100, height: 100 }
    expect(chooseSides(left, right)).toEqual({ sourceSide: 'right', targetSide: 'left' })
  })
  it('picks top/bottom when the target is below', () => {
    const top: Rect = { x: 0, y: 0, width: 100, height: 100 }
    const bottom: Rect = { x: 0, y: 300, width: 100, height: 100 }
    expect(chooseSides(top, bottom)).toEqual({ sourceSide: 'bottom', targetSide: 'top' })
  })
})
