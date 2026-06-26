import { describe, expect, it } from 'vitest'
import { clampIndex, defaultStopTitle, moveStop, resolveStop } from './tour'
import type { TourStop } from '../format/types'

function stop(over: Partial<TourStop> = {}): TourStop {
  return { id: 's1', title: 'Stop', note: '', viewRootId: null, selectedNodeIds: [], ...over }
}

describe('resolveStop', () => {
  const present = new Set(['n_a', 'n_b', 'c_1'])

  it('keeps a valid level and selection unchanged', () => {
    const r = resolveStop(stop({ viewRootId: 'c_1', selectedNodeIds: ['n_a', 'n_b'] }), present)
    expect(r).toEqual({ viewRootId: 'c_1', selectedNodeIds: ['n_a', 'n_b'] })
  })

  it('falls back to root when the stored level no longer exists', () => {
    const r = resolveStop(stop({ viewRootId: 'gone', selectedNodeIds: ['n_a'] }), present)
    expect(r.viewRootId).toBeNull()
    expect(r.selectedNodeIds).toEqual(['n_a'])
  })

  it('drops selected ids that no longer exist', () => {
    const r = resolveStop(stop({ selectedNodeIds: ['n_a', 'ghost', 'n_b'] }), present)
    expect(r.selectedNodeIds).toEqual(['n_a', 'n_b'])
  })

  it('a root-level stop stays at root', () => {
    expect(resolveStop(stop({ viewRootId: null }), present).viewRootId).toBeNull()
  })
})

describe('moveStop', () => {
  const stops = [stop({ id: 'a' }), stop({ id: 'b' }), stop({ id: 'c' })]

  it('moves a stop up (earlier)', () => {
    expect(moveStop(stops, 'b', -1).map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('moves a stop down (later)', () => {
    expect(moveStop(stops, 'b', 1).map((s) => s.id)).toEqual(['a', 'c', 'b'])
  })

  it('is a no-op at the top edge', () => {
    expect(moveStop(stops, 'a', -1).map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('is a no-op at the bottom edge', () => {
    expect(moveStop(stops, 'c', 1).map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('is a no-op for an unknown id, returning a fresh array', () => {
    const out = moveStop(stops, 'zzz', 1)
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c'])
    expect(out).not.toBe(stops)
  })
})

describe('clampIndex', () => {
  it('clamps below and above the range', () => {
    expect(clampIndex(-3, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    expect(clampIndex(2, 4)).toBe(2)
  })

  it('clamps to 0 for an empty list', () => {
    expect(clampIndex(5, 0)).toBe(0)
  })
})

describe('defaultStopTitle', () => {
  it('is 1-based and human', () => {
    expect(defaultStopTitle(0)).toBe('Stop 1')
    expect(defaultStopTitle(4)).toBe('Stop 5')
  })
})
