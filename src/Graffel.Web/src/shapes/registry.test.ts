import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getShape,
  resolveAnchors,
  resolveDefaultLabelPosition,
  resolveFit,
  resolveIconBounds,
  resolveIsContainer,
  searchShapes,
  useLibraryPrefs,
} from './registry'
import { DEFAULT_ANCHORS } from '../canvas/anchors'
import type { ShapeDef } from './types'

// A minimal synthetic shape so the resolve* helpers are tested against controlled
// inputs (real shapes exercise the same code but pin fewer edge cases).
function def(partial: Partial<ShapeDef>): ShapeDef {
  return {
    id: 'x:test',
    packId: 'x',
    label: 'Test',
    defaultSize: { w: 100, h: 100 },
    render: () => null,
    ...partial,
  }
}

describe('getShape', () => {
  it('resolves a pack-qualified id', () => {
    expect(getShape('basic:rectangle')?.id).toBe('basic:rectangle')
  })

  it('resolves the legacy unqualified alias to the same shape', () => {
    expect(getShape('rectangle')?.id).toBe('basic:rectangle')
    expect(getShape('database')?.id).toBe('arch-core:database')
  })

  it('returns undefined for an unknown id', () => {
    expect(getShape('nope:nonexistent')).toBeUndefined()
  })
})

describe('resolveFit', () => {
  it('honours an explicit fit override', () => {
    expect(resolveFit(def({ packId: 'basic', fit: 'contain' }))).toBe('contain')
    expect(resolveFit(def({ packId: 'arch-core', fit: 'fill' }))).toBe('fill')
  })

  it('defaults to fill for container packs (basic, flow)', () => {
    expect(resolveFit(def({ packId: 'basic' }))).toBe('fill')
    expect(resolveFit(def({ packId: 'flow' }))).toBe('fill')
  })

  it('defaults to contain for pictogram packs and for an unknown shape', () => {
    expect(resolveFit(def({ packId: 'arch-core' }))).toBe('contain')
    expect(resolveFit(undefined)).toBe('contain')
  })
})

describe('resolveDefaultLabelPosition', () => {
  it('honours an explicit override', () => {
    expect(resolveDefaultLabelPosition(def({ packId: 'basic', defaultLabelPosition: 'bottom' }))).toBe('bottom')
  })

  it('derives center for fill shapes, top for pictograms', () => {
    expect(resolveDefaultLabelPosition(def({ packId: 'basic' }))).toBe('center') // fill → inside
    expect(resolveDefaultLabelPosition(def({ packId: 'arch-core' }))).toBe('top') // contain → above
    expect(resolveDefaultLabelPosition(undefined)).toBe('top')
  })
})

describe('resolveIsContainer', () => {
  it('is true only when the shape declares it', () => {
    expect(resolveIsContainer(def({ isContainer: true }))).toBe(true)
    expect(resolveIsContainer(def({}))).toBe(false)
    expect(resolveIsContainer(undefined)).toBe(false)
  })
})

describe('resolveIconBounds', () => {
  it('returns an explicit iconBounds', () => {
    const b = { x: 10, y: 20, w: 40, h: 60 }
    expect(resolveIconBounds(def({ iconBounds: b }))).toEqual(b)
  })

  it('falls back to the full 0–100 box when nothing is known', () => {
    expect(resolveIconBounds(def({ id: 'x:unmeasured' }))).toEqual({ x: 0, y: 0, w: 100, h: 100 })
  })
})

describe('resolveAnchors', () => {
  it('uses box-edge midpoints when a shape declares no overrides', () => {
    expect(resolveAnchors(def({ id: 'x:unmeasured' }))).toEqual(DEFAULT_ANCHORS)
  })

  it('derives side midpoints from iconBounds', () => {
    const a = resolveAnchors(def({ iconBounds: { x: 10, y: 20, w: 40, h: 60 } }))
    expect(a.top).toEqual({ x: 30, y: 20 })     // x + w/2, y
    expect(a.right).toEqual({ x: 50, y: 50 })    // x + w, y + h/2
    expect(a.bottom).toEqual({ x: 30, y: 80 })   // x + w/2, y + h
    expect(a.left).toEqual({ x: 10, y: 50 })     // x, y + h/2
  })

  it('lets an explicit handlePositions side win over the derived one', () => {
    const a = resolveAnchors(def({
      iconBounds: { x: 10, y: 20, w: 40, h: 60 },
      handlePositions: { top: { x: 5, y: 5 } },
    }))
    expect(a.top).toEqual({ x: 5, y: 5 })        // overridden
    expect(a.right).toEqual({ x: 50, y: 50 })    // still derived from iconBounds
  })
})

describe('searchShapes', () => {
  it('matches on label and keywords', () => {
    const results = searchShapes('database')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((s) => s.id === 'arch-core:database')).toBe(true)
  })

  it('is case-insensitive and returns nothing for a blank query', () => {
    expect(searchShapes('DATABASE').length).toBeGreaterThan(0)
    expect(searchShapes('')).toEqual([])
    expect(searchShapes('   ')).toEqual([])
  })
})

describe('useLibraryPrefs', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('enables core packs and disables opt-in vendor packs by default', () => {
    const prefs = useLibraryPrefs.getState()
    expect(prefs.isEnabled('basic')).toBe(true)
    // Vendor packs ship disabled (opt-in) — v3.22.
    expect(prefs.isEnabled('gcp')).toBe(false)
    expect(prefs.isEnabled('azure')).toBe(false)
  })

  it('togglePack flips a pack and persists the choice', () => {
    useLibraryPrefs.getState().togglePack('basic')
    expect(useLibraryPrefs.getState().isEnabled('basic')).toBe(false)
    expect(localStorage.getItem('graffel.libraryPrefs.v1')).toContain('basic')
    // Toggle back to the default.
    useLibraryPrefs.getState().togglePack('basic')
    expect(useLibraryPrefs.getState().isEnabled('basic')).toBe(true)
  })
})

describe('useLibraryPrefs legacy migration', () => {
  afterEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('migrates the legacy { disabledPacks: [...] } shape to overrides', async () => {
    localStorage.setItem('graffel.libraryPrefs.v1', JSON.stringify({ disabledPacks: ['basic'] }))
    vi.resetModules()
    const fresh = await import('./registry')
    expect(fresh.useLibraryPrefs.getState().isEnabled('basic')).toBe(false)
  })
})
