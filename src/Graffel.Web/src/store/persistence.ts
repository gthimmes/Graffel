import {
  parseDocument,
  serializeDocument,
} from '../format/graffelFile'
import type { GraffelDocument } from '../format/types'

export const LOCAL_STORAGE_KEY = 'graffel.currentDocument.v1'

export function saveToLocalStorage(doc: GraffelDocument): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, serializeDocument(doc))
  } catch {
    // Quota exceeded or storage disabled — silently fail; user still has in-memory state.
  }
}

export function loadFromLocalStorage(): GraffelDocument | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) return null
  try {
    return parseDocument(raw)
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    return null
  }
}
