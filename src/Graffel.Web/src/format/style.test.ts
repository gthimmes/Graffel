import { describe, expect, it } from 'vitest'
import { fontFamilyCss, fontWeightCss, markerSizePx, strokeDashArray, FONT_FAMILIES } from './style'

describe('fontFamilyCss', () => {
  it('returns the css for a known family', () => {
    expect(fontFamilyCss('mono')).toContain('monospace')
    expect(fontFamilyCss('serif')).toContain('Georgia')
  })

  it('falls back to the first family for unknown/undefined', () => {
    expect(fontFamilyCss(undefined)).toBe(FONT_FAMILIES[0].css)
    // @ts-expect-error — exercising the runtime fallback for a bad id
    expect(fontFamilyCss('bogus')).toBe(FONT_FAMILIES[0].css)
  })
})

describe('fontWeightCss', () => {
  it('maps tokens to numeric weights', () => {
    expect(fontWeightCss('bold')).toBe(700)
    expect(fontWeightCss('medium')).toBe(500)
    expect(fontWeightCss('regular')).toBe(400)
  })

  it('defaults to 400 for undefined', () => {
    expect(fontWeightCss(undefined)).toBe(400)
  })
})

describe('strokeDashArray', () => {
  it('returns a pattern for dashed and dotted, nothing for solid', () => {
    expect(strokeDashArray('dashed')).toBe('8 4')
    expect(strokeDashArray('dotted')).toBe('2 4')
    expect(strokeDashArray('solid')).toBeUndefined()
    expect(strokeDashArray(undefined)).toBeUndefined()
  })
})

describe('markerSizePx', () => {
  it('scales by size token, defaulting to medium', () => {
    expect(markerSizePx('sm')).toBe(5)
    expect(markerSizePx('md')).toBe(7)
    expect(markerSizePx('lg')).toBe(9)
    expect(markerSizePx(undefined)).toBe(7)
  })
})
