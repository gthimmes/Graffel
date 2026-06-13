import {
  parseDocument,
  serializeDocument,
} from '../format/graffelFile'
import type { GraffelDocument } from '../format/types'

// v3.16 — multi-document local library. Each diagram is stored under its own
// key; a small index tracks the set + which one is current. The pre-v3.16
// single-document key is migrated on first load, then removed.

/** Pre-v3.16 single-document key. Read once for migration, then deleted. */
export const LEGACY_DOC_KEY = 'graffel.currentDocument.v1'
/** Back-compat export (some tests/refs used this name for the legacy key). */
export const LOCAL_STORAGE_KEY = LEGACY_DOC_KEY
export const LIBRARY_KEY = 'graffel.library.v1'
export const DOC_KEY_PREFIX = 'graffel.doc.v1.'
export const SNAP_GRID_KEY = 'graffel.snapGrid.v1'

export interface LibraryEntry {
  id: string
  title: string
  updatedAt: string
}

interface LibraryIndex {
  currentId: string | null
  docs: Record<string, { title: string; updatedAt: string }>
}

function docKey(id: string): string {
  return `${DOC_KEY_PREFIX}${id}`
}

function readIndex(): LibraryIndex {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    if (!raw) return { currentId: null, docs: {} }
    const parsed = JSON.parse(raw) as Partial<LibraryIndex>
    return {
      currentId: parsed.currentId ?? null,
      docs: parsed.docs && typeof parsed.docs === 'object' ? parsed.docs : {},
    }
  } catch {
    return { currentId: null, docs: {} }
  }
}

function writeIndex(index: LibraryIndex): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(index))
  } catch {
    // Quota / disabled — accept silent failure; in-memory state still works.
  }
}

/** Persist a document (full body + index entry) and mark it current. */
export function saveDocument(doc: GraffelDocument): void {
  try {
    localStorage.setItem(docKey(doc.id), serializeDocument(doc))
  } catch {
    return // can't persist the body — don't leave a dangling index entry
  }
  const index = readIndex()
  index.docs[doc.id] = { title: doc.metadata.title, updatedAt: doc.metadata.updatedAt }
  index.currentId = doc.id
  writeIndex(index)
}

/** Load one document by id (null if missing or corrupt — corrupt body is cleared). */
export function loadDocumentById(id: string): GraffelDocument | null {
  const raw = localStorage.getItem(docKey(id))
  if (!raw) return null
  try {
    return parseDocument(raw)
  } catch {
    localStorage.removeItem(docKey(id))
    return null
  }
}

/**
 * The current document. On first run after upgrade, migrates the legacy
 * single-document key into the library (then deletes it).
 */
export function loadCurrent(): GraffelDocument | null {
  migrateLegacy()
  const index = readIndex()
  if (index.currentId) {
    const doc = loadDocumentById(index.currentId)
    if (doc) return doc
  }
  // Current pointer is stale/missing — fall back to the most recent document.
  const list = listDocuments()
  if (list.length > 0) {
    const doc = loadDocumentById(list[0]!.id)
    if (doc) {
      setCurrentId(doc.id)
      return doc
    }
  }
  return null
}

function migrateLegacy(): void {
  const legacy = localStorage.getItem(LEGACY_DOC_KEY)
  if (legacy === null) return
  try {
    const doc = parseDocument(legacy)
    // Only import if we don't already have it (idempotent across reloads).
    if (!localStorage.getItem(docKey(doc.id))) saveDocument(doc)
    else setCurrentId(doc.id)
  } catch {
    // Corrupt legacy doc — nothing to migrate.
  }
  localStorage.removeItem(LEGACY_DOC_KEY)
}

/** All documents, most-recently-updated first. */
export function listDocuments(): LibraryEntry[] {
  const index = readIndex()
  return Object.entries(index.docs)
    .map(([id, meta]) => ({ id, title: meta.title, updatedAt: meta.updatedAt }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
}

export function deleteDocument(id: string): void {
  try {
    localStorage.removeItem(docKey(id))
  } catch {
    // ignore
  }
  const index = readIndex()
  delete index.docs[id]
  if (index.currentId === id) index.currentId = null
  writeIndex(index)
}

export function setCurrentId(id: string | null): void {
  const index = readIndex()
  index.currentId = id
  writeIndex(index)
}

export function getCurrentId(): string | null {
  return readIndex().currentId
}

// Back-compat aliases so existing callers (DiagramCanvas) stay unchanged.
export const saveToLocalStorage = saveDocument
export const loadFromLocalStorage = loadCurrent

export function saveSnapGrid(value: boolean): void {
  try {
    localStorage.setItem(SNAP_GRID_KEY, value ? '1' : '0')
  } catch {
    // ignore — preference is non-essential
  }
}

export function loadSnapGrid(): boolean {
  return localStorage.getItem(SNAP_GRID_KEY) === '1'
}
