import { beforeEach, describe, expect, it } from 'vitest'
import {
  DOC_KEY_PREFIX,
  LEGACY_DOC_KEY,
  LIBRARY_KEY,
  SNAP_GRID_KEY,
  deleteDocument,
  getCurrentId,
  listDocuments,
  loadCurrent,
  loadDocumentById,
  loadFromLocalStorage,
  loadSnapGrid,
  saveDocument,
  saveSnapGrid,
  setCurrentId,
} from './persistence'
import { createEmptyDocument, serializeDocument } from '../format/graffelFile'

describe('persistence (multi-document library)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadCurrent()).toBeNull()
  })

  it('round-trips a document and marks it current', () => {
    const doc = createEmptyDocument()
    doc.metadata.title = 'My diagram'
    saveDocument(doc)
    const restored = loadCurrent()
    expect(restored).not.toBeNull()
    expect(restored!.metadata.title).toBe('My diagram')
    expect(restored!.id).toBe(doc.id)
    expect(getCurrentId()).toBe(doc.id)
    expect(localStorage.getItem(`${DOC_KEY_PREFIX}${doc.id}`)).not.toBeNull()
  })

  it('lists documents most-recently-updated first', () => {
    const a = createEmptyDocument(); a.metadata.title = 'A'; a.metadata.updatedAt = '2026-06-01T00:00:00Z'
    const b = createEmptyDocument(); b.metadata.title = 'B'; b.metadata.updatedAt = '2026-06-10T00:00:00Z'
    saveDocument(a)
    saveDocument(b)
    expect(listDocuments().map((d) => d.title)).toEqual(['B', 'A'])
  })

  it('deletes a document and clears the current pointer when it matched', () => {
    const doc = createEmptyDocument()
    saveDocument(doc)
    deleteDocument(doc.id)
    expect(loadDocumentById(doc.id)).toBeNull()
    expect(listDocuments()).toHaveLength(0)
    expect(getCurrentId()).toBeNull()
  })

  it('falls back to the most recent doc when currentId is stale', () => {
    const doc = createEmptyDocument(); doc.metadata.title = 'Survivor'
    saveDocument(doc)
    setCurrentId('does-not-exist')
    const restored = loadCurrent()
    expect(restored!.metadata.title).toBe('Survivor')
    expect(getCurrentId()).toBe(doc.id)
  })

  it('clears a corrupt document body on load', () => {
    const doc = createEmptyDocument()
    saveDocument(doc)
    localStorage.setItem(`${DOC_KEY_PREFIX}${doc.id}`, '{bad json')
    expect(loadDocumentById(doc.id)).toBeNull()
    expect(localStorage.getItem(`${DOC_KEY_PREFIX}${doc.id}`)).toBeNull()
  })

  describe('legacy migration', () => {
    it('imports the pre-v3.16 single-document key, then deletes it', () => {
      const legacy = createEmptyDocument()
      legacy.metadata.title = 'Legacy diagram'
      localStorage.setItem(LEGACY_DOC_KEY, serializeDocument(legacy))

      const restored = loadFromLocalStorage()
      expect(restored!.metadata.title).toBe('Legacy diagram')
      expect(restored!.id).toBe(legacy.id)
      // Legacy key gone; library now holds it.
      expect(localStorage.getItem(LEGACY_DOC_KEY)).toBeNull()
      expect(localStorage.getItem(LIBRARY_KEY)).not.toBeNull()
      expect(getCurrentId()).toBe(legacy.id)
      expect(listDocuments().map((d) => d.id)).toEqual([legacy.id])
    })

    it('is idempotent across reloads (no duplicate import)', () => {
      const legacy = createEmptyDocument()
      localStorage.setItem(LEGACY_DOC_KEY, serializeDocument(legacy))
      loadCurrent()
      // Simulate a second session: legacy key is already gone.
      const again = loadCurrent()
      expect(again!.id).toBe(legacy.id)
      expect(listDocuments()).toHaveLength(1)
    })
  })

  describe('snap grid preference (v3.9)', () => {
    it('defaults to false when nothing is stored', () => {
      expect(loadSnapGrid()).toBe(false)
    })

    it('round-trips true / false through localStorage', () => {
      saveSnapGrid(true)
      expect(loadSnapGrid()).toBe(true)
      saveSnapGrid(false)
      expect(loadSnapGrid()).toBe(false)
    })

    it('writes to the documented key', () => {
      saveSnapGrid(true)
      expect(localStorage.getItem(SNAP_GRID_KEY)).toBe('1')
    })

    it('treats unknown stored values as false', () => {
      localStorage.setItem(SNAP_GRID_KEY, 'yes-please')
      expect(loadSnapGrid()).toBe(false)
    })
  })
})
