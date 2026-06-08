import { describe, expect, it } from 'vitest'
import { anchorToBoxPercent, DEFAULT_ANCHORS, type Anchor } from './anchors'

const R: Anchor = DEFAULT_ANCHORS.right // (100, 50)
const L: Anchor = DEFAULT_ANCHORS.left  // (0, 50)
const T: Anchor = DEFAULT_ANCHORS.top   // (50, 0)
const B: Anchor = DEFAULT_ANCHORS.bottom // (50, 100)

describe('anchorToBoxPercent', () => {
  it('fill mode maps viewBox coords straight to box percent', () => {
    expect(anchorToBoxPercent(R, { w: 200, h: 100 }, 'fill')).toEqual({ left: 100, top: 50 })
    expect(anchorToBoxPercent({ x: 25, y: 75 }, { w: 80, h: 130 }, 'fill')).toEqual({ left: 25, top: 75 })
  })

  it('contain on a square box is the identity', () => {
    expect(anchorToBoxPercent(R, { w: 100, h: 100 }, 'contain')).toEqual({ left: 100, top: 50 })
    expect(anchorToBoxPercent(T, { w: 120, h: 120 }, 'contain')).toEqual({ left: 50, top: 0 })
  })

  it('contain on a WIDE box insets the left/right anchors toward the centered icon', () => {
    // w=200,h=100 -> scale=1, icon 100 wide centered -> 50px margin each side.
    // right (vx=100) lands at px=150 -> 75% ; left at px=50 -> 25%.
    expect(anchorToBoxPercent(R, { w: 200, h: 100 }, 'contain')).toEqual({ left: 75, top: 50 })
    expect(anchorToBoxPercent(L, { w: 200, h: 100 }, 'contain')).toEqual({ left: 25, top: 50 })
    // top/bottom stay on the box edge vertically, horizontally centered.
    expect(anchorToBoxPercent(T, { w: 200, h: 100 }, 'contain')).toEqual({ left: 50, top: 0 })
    expect(anchorToBoxPercent(B, { w: 200, h: 100 }, 'contain')).toEqual({ left: 50, top: 100 })
  })

  it('contain on a TALL box insets the top/bottom anchors toward the centered icon', () => {
    // w=100,h=200 -> scale=1, icon 100 tall centered -> 50px margin top/bottom.
    expect(anchorToBoxPercent(T, { w: 100, h: 200 }, 'contain')).toEqual({ left: 50, top: 25 })
    expect(anchorToBoxPercent(B, { w: 100, h: 200 }, 'contain')).toEqual({ left: 50, top: 75 })
    expect(anchorToBoxPercent(R, { w: 100, h: 200 }, 'contain')).toEqual({ left: 100, top: 50 })
  })

  it('contain scales the anchor with the icon when the box is larger than the viewBox', () => {
    // w=300,h=150 -> scale=min(3,1.5)=1.5, icon 150 wide centered in 300 -> 75px margin.
    // right (vx=100) -> px=75+150=225 -> 75%.
    expect(anchorToBoxPercent(R, { w: 300, h: 150 }, 'contain')).toEqual({ left: 75, top: 50 })
  })
})
