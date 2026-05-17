import { describe, expect, it } from 'vitest'
import { scoreMatch, rankCommands } from './match'

describe('scoreMatch', () => {
  it('returns null when the query has chars not present in the haystack', () => {
    expect(scoreMatch('xyz', 'add service')).toBeNull()
  })

  it('returns null for non-empty query against empty haystack', () => {
    expect(scoreMatch('a', '')).toBeNull()
  })

  it('returns 0 (a non-null score) for an empty query', () => {
    expect(scoreMatch('', 'anything')).not.toBeNull()
  })

  it('matches case-insensitively', () => {
    expect(scoreMatch('SVC', 'Insert Service')).not.toBeNull()
  })

  it('gives a higher score when the query is a prefix of a haystack token', () => {
    const exact = scoreMatch('serv', 'insert service')!
    const scattered = scoreMatch('serv', 'send recursive variant')!
    expect(exact).toBeGreaterThan(scattered)
  })

  it('scores more matched characters higher', () => {
    expect(scoreMatch('serv', 'insert service')!)
      .toBeGreaterThan(scoreMatch('se', 'insert service')!)
  })
})

describe('rankCommands', () => {
  const cmds = [
    { id: 'insert-service',  label: 'Insert Service' },
    { id: 'insert-database', label: 'Insert Database' },
    { id: 'export-svg',      label: 'Export SVG' },
    { id: 'undo',            label: 'Undo' },
  ]

  it('returns all commands when query is empty', () => {
    const r = rankCommands(cmds, '')
    expect(r).toHaveLength(4)
  })

  it('filters out non-matching commands', () => {
    const r = rankCommands(cmds, 'export')
    expect(r.map((c) => c.id)).toEqual(['export-svg'])
  })

  it('prefix matches outrank scattered matches', () => {
    const r = rankCommands(cmds, 'serv')
    expect(r[0]!.id).toBe('insert-service')
  })

  it('also matches against keywords when provided', () => {
    const withKw = [
      { id: 'export-png', label: 'Export PNG', keywords: ['image', 'raster'] },
    ]
    const r = rankCommands(withKw, 'raster')
    expect(r.map((c) => c.id)).toEqual(['export-png'])
  })
})
