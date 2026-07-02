import { describe, expect, it } from 'vitest'
import { timeAgo } from './timeAgo'

const now = 1_000_000_000_000 // fixed reference

describe('timeAgo', () => {
  it('says "just now" within a few seconds', () => {
    expect(timeAgo(now - 2_000, now)).toBe('just now')
  })
  it('counts seconds', () => {
    expect(timeAgo(now - 30_000, now)).toBe('30s ago')
  })
  it('counts minutes', () => {
    expect(timeAgo(now - 5 * 60_000, now)).toBe('5m ago')
  })
  it('counts hours', () => {
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe('3h ago')
  })
  it('counts days', () => {
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe('2d ago')
  })
  it('accepts an ISO string', () => {
    expect(timeAgo(new Date(now - 30_000).toISOString(), now)).toBe('30s ago')
  })
})
