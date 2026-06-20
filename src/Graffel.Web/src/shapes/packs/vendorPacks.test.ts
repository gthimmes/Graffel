import { describe, expect, it } from 'vitest'
import { GCP_PACK } from './gcp'
import { AZURE_PACK } from './azure'
import { getShape, PACKS, searchShapes, useLibraryPrefs } from '../registry'

const VENDORS = [
  { pack: GCP_PACK, id: 'gcp', sample: 'gcp:cloud-run', sampleLabel: 'Cloud Run', search: ['firestore', 'gcp:firestore'] as const },
  { pack: AZURE_PACK, id: 'azure', sample: 'azure:aks', sampleLabel: 'AKS', search: ['cosmos', 'azure:cosmos-db'] as const },
]

describe.each(VENDORS)('$id pack', ({ pack, id, sample, sampleLabel, search }) => {
  it('is registered in the manifest', () => {
    expect(PACKS.find((p) => p.id === id)).toBe(pack)
  })

  it('has a healthy set of namespaced, uniquely-identified, tile-bounded shapes', () => {
    expect(pack.shapes.length).toBeGreaterThanOrEqual(18)
    const ids = pack.shapes.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of pack.shapes) {
      expect(s.id.startsWith(`${id}:`)).toBe(true)
      expect(s.packId).toBe(id)
      expect(typeof s.render).toBe('function')
      expect(s.iconBounds).toEqual({ x: 6, y: 6, w: 88, h: 88 })
      expect(s.defaultStyle?.fill).toBeTruthy()
    }
  })

  it('resolves a sample shape through the shared registry', () => {
    expect(getShape(sample)?.label).toBe(sampleLabel)
  })

  it('is findable in cross-pack search', () => {
    expect(searchShapes(search[0]).some((s) => s.id === search[1])).toBe(true)
  })

  it('is an opt-in vendor pack: ships disabled', () => {
    expect(pack.defaultEnabled).toBe(false)
    expect(useLibraryPrefs.getState().isEnabled(id)).toBe(false)
  })
})
