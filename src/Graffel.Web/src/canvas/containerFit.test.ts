import { describe, expect, it } from 'vitest'
import { fitContainer, type Box } from './containerFit'

const container: Box = { position: { x: 100, y: 100 }, size: { w: 300, h: 200 } }

describe('fitContainer', () => {
  it('returns null when every child fits with padding', () => {
    const child: Box = { position: { x: 40, y: 40 }, size: { w: 100, h: 60 } } // right=140,bot=100 inside 300x200-24
    expect(fitContainer(container, [child])).toBeNull()
  })

  it('returns null when there are no children', () => {
    expect(fitContainer(container, [])).toBeNull()
  })

  it('grows width/height when a child pokes past the right/bottom edge', () => {
    const child: Box = { position: { x: 200, y: 150 }, size: { w: 140, h: 90 } } // right=340,bot=240
    const r = fitContainer(container, [child], 24)!
    expect(r.childDelta).toEqual({ x: 0, y: 0 })
    expect(r.position).toEqual({ x: 100, y: 100 }) // origin unchanged
    expect(r.size.w).toBe(340 + 24) // maxX + padding
    expect(r.size.h).toBe(240 + 24)
  })

  it('shifts the origin (and offsets children) when a child pokes past the left/top edge', () => {
    const child: Box = { position: { x: -30, y: -10 }, size: { w: 100, h: 60 } }
    const r = fitContainer(container, [child], 24)!
    // minX=-30 → shiftX = 24-(-30) = 54; minY=-10 → shiftY = 34.
    expect(r.childDelta).toEqual({ x: 54, y: 34 })
    // Container origin moves left/up by the shift.
    expect(r.position).toEqual({ x: 100 - 54, y: 100 - 34 })
    // Width grows to fit: maxX = -30+100 = 70; 70 + 54 + 24 = 148, but not below current 300.
    expect(r.size.w).toBe(300)
    expect(r.size.h).toBe(200)
  })

  it('after applying the result, children sit within the padded interior', () => {
    const child: Box = { position: { x: -30, y: 150 }, size: { w: 100, h: 90 } }
    const r = fitContainer(container, [child], 24)!
    // New relative position after offset.
    const nx = child.position.x + r.childDelta.x
    const ny = child.position.y + r.childDelta.y
    expect(nx).toBeGreaterThanOrEqual(24)
    expect(ny).toBeGreaterThanOrEqual(24)
    expect(nx + child.size.w).toBeLessThanOrEqual(r.size.w - 24)
    expect(ny + child.size.h).toBeLessThanOrEqual(r.size.h - 24)
  })
})
