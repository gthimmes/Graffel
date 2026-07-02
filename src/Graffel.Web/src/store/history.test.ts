import { beforeEach, describe, expect, it } from 'vitest'
import {
  capHistory,
  deleteSnapshot,
  lastSnapshotAt,
  listSnapshots,
  loadSnapshot,
  maybeAutoCheckpoint,
  saveSnapshot,
  shouldAutoCheckpoint,
  type StoredSnapshot,
} from './history'
import { createEmptyDocument } from '../format/graffelFile'
import type { GraffelDocument } from '../format/types'

const snap = (id: string, kind: 'auto' | 'manual'): StoredSnapshot => ({
  id,
  at: '2026-07-01T00:00:00.000Z',
  kind,
  label: null,
  body: '{}',
})

describe('capHistory (pure)', () => {
  it('drops the oldest auto snapshots beyond the auto cap', () => {
    const list = [snap('a1', 'auto'), snap('a2', 'auto'), snap('a3', 'auto')]
    const kept = capHistory(list, 2, 40)
    expect(kept.map((s) => s.id)).toEqual(['a2', 'a3']) // oldest auto dropped
  })

  it('never drops manual snapshots to satisfy the auto cap', () => {
    const list = [snap('m1', 'manual'), snap('a1', 'auto'), snap('a2', 'auto'), snap('a3', 'auto')]
    const kept = capHistory(list, 1, 40)
    expect(kept.map((s) => s.id)).toEqual(['m1', 'a3'])
  })

  it('drops oldest entries when over the hard total cap', () => {
    const list = [snap('m1', 'manual'), snap('m2', 'manual'), snap('m3', 'manual')]
    const kept = capHistory(list, 20, 2)
    expect(kept.map((s) => s.id)).toEqual(['m2', 'm3'])
  })
})

describe('shouldAutoCheckpoint (pure)', () => {
  it('checkpoints when there is no prior snapshot', () => {
    expect(shouldAutoCheckpoint(null, 1000, 500)).toBe(true)
  })
  it('waits until the minimum interval has elapsed', () => {
    expect(shouldAutoCheckpoint(1000, 1400, 500)).toBe(false)
    expect(shouldAutoCheckpoint(1000, 1500, 500)).toBe(true)
  })
})

describe('history storage (localStorage)', () => {
  let doc: GraffelDocument
  beforeEach(() => {
    localStorage.clear()
    doc = createEmptyDocument()
    doc.id = 'DOC1'
    doc.metadata.title = 'Test'
  })

  it('saves and lists snapshots newest-first', () => {
    saveSnapshot('DOC1', doc, { kind: 'manual', label: 'first' })
    saveSnapshot('DOC1', doc, { kind: 'auto' })
    const list = listSnapshots('DOC1')
    expect(list).toHaveLength(2)
    expect(list[0].kind).toBe('auto') // newest first
    expect(list[1].label).toBe('first')
  })

  it('round-trips a snapshot body back to a document', () => {
    doc.nodes = [
      { id: 'n1', type: 'basic:rectangle', parentId: null, position: { x: 1, y: 2 }, size: { w: 10, h: 10 }, data: { label: 'Hi' } },
    ]
    const meta = saveSnapshot('DOC1', doc, { kind: 'manual' })
    const restored = loadSnapshot('DOC1', meta.id)
    expect(restored!.nodes[0].data.label).toBe('Hi')
  })

  it('deletes a snapshot by id', () => {
    const a = saveSnapshot('DOC1', doc, { kind: 'manual' })
    saveSnapshot('DOC1', doc, { kind: 'manual' })
    deleteSnapshot('DOC1', a.id)
    expect(listSnapshots('DOC1').map((s) => s.id)).not.toContain(a.id)
  })

  it('keeps history per-document', () => {
    saveSnapshot('DOC1', doc, { kind: 'manual' })
    expect(listSnapshots('DOC2')).toHaveLength(0)
  })

  it('auto-checkpoints only after the interval, tracking the last snapshot time', () => {
    expect(lastSnapshotAt('DOC1')).toBeNull()
    expect(maybeAutoCheckpoint('DOC1', doc, 1_000_000)).toBe(true)
    // Immediately after, the gate blocks another.
    expect(maybeAutoCheckpoint('DOC1', doc, 1_000_500)).toBe(false)
    // After the interval it checkpoints again.
    expect(maybeAutoCheckpoint('DOC1', doc, 1_000_000 + 200_000)).toBe(true)
    expect(listSnapshots('DOC1')).toHaveLength(2)
  })
})
