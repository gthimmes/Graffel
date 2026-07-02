import { useDiagramStore } from './diagramStore'
import type { GraffelDocument } from '../format/types'
import {
  deleteDocument,
  loadDocumentById,
  saveDocument,
  setCurrentId,
} from './persistence'
import { loadSnapshot, saveSnapshot } from './history'

// v3.16 — document-level operations layered over the store + the library
// persistence. These keep "New" non-destructive: the current diagram is always
// saved before we switch away from it.

/** Persist whatever's on the canvas right now as its own library entry. */
function saveCurrent(): void {
  saveDocument(useDiagramStore.getState().toDocument())
}

/** Save the current diagram, then start a fresh blank one (now the current). */
export function newDocument(): void {
  saveCurrent()
  useDiagramStore.getState().reset()
  saveCurrent()
}

/** Switch to a stored document (saving the current one first). No-op if missing. */
export function openDocument(id: string): void {
  if (id === useDiagramStore.getState().documentId) return
  const doc = loadDocumentById(id)
  if (!doc) return
  saveCurrent()
  useDiagramStore.getState().loadDocument(doc)
  setCurrentId(id)
}

/** Load a parsed document (e.g. an opened .graffel file) into the library as the
 *  current diagram, saving whatever was open first. */
export function importDocument(doc: GraffelDocument): void {
  saveCurrent()
  useDiagramStore.getState().loadDocument(doc)
  saveDocument(doc)
}

/**
 * Restore a snapshot into the current document. The pre-restore state is first
 * captured as its own checkpoint, so a restore is never destructive — you can
 * restore back to where you were. No-op if the snapshot is missing/corrupt.
 */
export function restoreSnapshot(snapId: string): boolean {
  const store = useDiagramStore.getState()
  const docId = store.documentId
  const snap = loadSnapshot(docId, snapId)
  if (!snap) return false
  saveSnapshot(docId, store.toDocument(), { kind: 'auto', label: 'Before restore' })
  store.loadDocument(snap)
  saveDocument(store.toDocument())
  return true
}

/** Rename any document — the current one in-place, others without switching. */
export function renameDocument(id: string, title: string): void {
  const store = useDiagramStore.getState()
  if (id === store.documentId) {
    store.setTitle(title)
    saveCurrent()
    return
  }
  const doc = loadDocumentById(id)
  if (!doc) return
  doc.metadata.title = title
  doc.metadata.updatedAt = new Date().toISOString()
  saveDocument(doc)
  // saveDocument marks the saved doc current; restore the real current pointer.
  setCurrentId(store.documentId)
}

/** Delete a document. Deleting the current one opens a fresh blank diagram. */
export function removeDocument(id: string): void {
  if (id === useDiagramStore.getState().documentId) {
    deleteDocument(id)
    useDiagramStore.getState().reset()
    saveCurrent()
  } else {
    deleteDocument(id)
  }
}
