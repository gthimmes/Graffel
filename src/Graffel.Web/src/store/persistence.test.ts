import { beforeEach, describe, expect, it } from 'vitest'
import {
  LOCAL_STORAGE_KEY,
  loadFromLocalStorage,
  saveToLocalStorage,
} from './persistence'
import { createEmptyDocument } from '../format/graffelFile'

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadFromLocalStorage()).toBeNull()
  })

  it('round-trips a document through localStorage', () => {
    const doc = createEmptyDocument()
    doc.metadata.title = 'My diagram'
    saveToLocalStorage(doc)
    const restored = loadFromLocalStorage()
    expect(restored).not.toBeNull()
    expect(restored!.metadata.title).toBe('My diagram')
    expect(restored!.id).toBe(doc.id)
  })

  it('writes to the documented key', () => {
    const doc = createEmptyDocument()
    saveToLocalStorage(doc)
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).not.toBeNull()
  })

  it('returns null and clears corrupted entries', () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, '{bad json')
    expect(loadFromLocalStorage()).toBeNull()
    // Corrupted entry is cleared so a future save can succeed.
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull()
  })
})
