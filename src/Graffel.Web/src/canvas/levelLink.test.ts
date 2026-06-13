import { describe, expect, it } from 'vitest'
import { levelHash, parseLevelHash } from './levelLink'

describe('levelLink', () => {
  it('formats a container id as a level hash', () => {
    expect(levelHash('n_abc')).toBe('#l=n_abc')
  })

  it('formats the root (null) as an empty hash', () => {
    expect(levelHash(null)).toBe('')
  })

  it('parses a level hash back to the id (with or without leading #)', () => {
    expect(parseLevelHash('#l=n_abc')).toBe('n_abc')
    expect(parseLevelHash('l=n_abc')).toBe('n_abc')
  })

  it('round-trips', () => {
    expect(parseLevelHash(levelHash('n_xyz'))).toBe('n_xyz')
  })

  it('returns null for empty or unrelated hashes', () => {
    expect(parseLevelHash('')).toBeNull()
    expect(parseLevelHash('#')).toBeNull()
    expect(parseLevelHash('#section-2')).toBeNull()
    expect(parseLevelHash('#l=')).toBeNull()
  })

  it('decodes percent-encoded ids', () => {
    expect(parseLevelHash('#l=' + encodeURIComponent('n a'))).toBe('n a')
  })
})
