import { describe, expect, it } from 'vitest'
import { toolbarAnchor, unionScreenBox, type Box } from './selectionBox'

const host: Box = { left: 100, top: 50, width: 1000, height: 800 }

describe('unionScreenBox', () => {
  it('returns the union of rects in host-local coords', () => {
    // Two viewport rects; host offset is (100,50).
    const a = { left: 200, top: 150, width: 80, height: 40 } // → local 100,100
    const b = { left: 400, top: 250, width: 60, height: 50 } // → local 300,200 .. 360,250
    const box = unionScreenBox([a, b], host)
    expect(box).toEqual({ left: 100, top: 100, width: 260, height: 150 })
  })

  it('returns null for an empty rect list', () => {
    expect(unionScreenBox([], host)).toBeNull()
  })
})

describe('toolbarAnchor', () => {
  const TOOLBAR_H = 36

  it('places the toolbar above the box when there is room', () => {
    const box: Box = { left: 300, top: 300, width: 200, height: 100 }
    const a = toolbarAnchor(box, host, TOOLBAR_H)
    expect(a.placement).toBe('above')
    expect(a.x).toBe(400) // box horizontal center
    expect(a.y).toBe(300) // box top; component offsets upward via translateY(-100%)
  })

  it('flips below when the box hugs the top of the host', () => {
    const box: Box = { left: 300, top: 5, width: 200, height: 100 }
    const a = toolbarAnchor(box, host, TOOLBAR_H)
    expect(a.placement).toBe('below')
    expect(a.y).toBe(105) // box bottom
  })

  it('centers x on the box regardless of placement', () => {
    const box: Box = { left: 0, top: 0, width: 120, height: 40 }
    expect(toolbarAnchor(box, host, TOOLBAR_H).x).toBe(60)
  })
})
