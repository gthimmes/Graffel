import { describe, expect, it } from 'vitest'
import { AWS_PACK } from './aws'
import { getShape, PACKS, searchShapes, useLibraryPrefs } from '../registry'

describe('AWS pack', () => {
  it('is registered in the pack manifest', () => {
    expect(PACKS.find((p) => p.id === 'aws')).toBe(AWS_PACK)
  })

  it('has a healthy set of services, all namespaced + uniquely identified', () => {
    expect(AWS_PACK.shapes.length).toBeGreaterThanOrEqual(20)
    const ids = AWS_PACK.shapes.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length) // unique
    for (const s of AWS_PACK.shapes) {
      expect(s.id.startsWith('aws:')).toBe(true)
      expect(s.packId).toBe('aws')
      expect(typeof s.render).toBe('function')
      // Every tile shares the silhouette bounds so connectors meet its edge.
      expect(s.iconBounds).toEqual({ x: 6, y: 6, w: 88, h: 88 })
      expect(s.defaultStyle?.fill).toBeTruthy()
    }
  })

  it('is resolvable by id through the shared registry', () => {
    expect(getShape('aws:ec2')?.label).toBe('EC2')
    expect(getShape('aws:s3')?.label).toBe('S3')
  })

  it('surfaces in cross-pack search by label and keyword', () => {
    expect(searchShapes('lambda').some((s) => s.id === 'aws:lambda')).toBe(true)
    expect(searchShapes('bucket').some((s) => s.id === 'aws:s3')).toBe(true)
    expect(searchShapes('kubernetes').some((s) => s.id === 'aws:eks')).toBe(true)
  })

  it('is an opt-in vendor pack: ships disabled, honored by library prefs', () => {
    expect(AWS_PACK.defaultEnabled).toBe(false)
    const prefs = useLibraryPrefs.getState()
    // Fresh store (no stored overrides): AWS off, vendor-neutral packs on.
    expect(prefs.isEnabled('aws')).toBe(false)
    expect(prefs.isEnabled('basic')).toBe(true)
    expect(prefs.isEnabled('cloud')).toBe(true)
    // Enabling it sticks.
    prefs.togglePack('aws')
    expect(useLibraryPrefs.getState().isEnabled('aws')).toBe(true)
    // Clean up so we don't leak enabled-state into other tests.
    useLibraryPrefs.getState().togglePack('aws')
    expect(useLibraryPrefs.getState().isEnabled('aws')).toBe(false)
  })
})
