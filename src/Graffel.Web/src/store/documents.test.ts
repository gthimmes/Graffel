import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'
import { getCurrentId, listDocuments, loadDocumentById } from './persistence'
import { importDocument, newDocument, openDocument, removeDocument, renameDocument, restoreSnapshot } from './documents'
import { listSnapshots, saveSnapshot } from './history'
import { createEmptyDocument } from '../format/graffelFile'

describe('document orchestration', () => {
  beforeEach(() => {
    localStorage.clear()
    useDiagramStore.getState().reset()
  })

  it('newDocument preserves the current diagram in the library and starts a blank one', () => {
    const s = useDiagramStore.getState()
    s.setTitle('First')
    s.addNode('rectangle', { x: 0, y: 0 })
    const firstId = useDiagramStore.getState().documentId

    newDocument()

    const st = useDiagramStore.getState()
    expect(st.documentId).not.toBe(firstId) // a fresh doc
    expect(st.nodes).toHaveLength(0)
    // The old one is safely in the library.
    expect(listDocuments().map((d) => d.id)).toContain(firstId)
    expect(loadDocumentById(firstId)!.nodes).toHaveLength(1)
  })

  it('openDocument switches to another stored diagram (saving the current first)', () => {
    const s = useDiagramStore.getState()
    s.setTitle('Doc A')
    s.addNode('rectangle', { x: 0, y: 0 })
    const aId = useDiagramStore.getState().documentId

    newDocument()
    useDiagramStore.getState().setTitle('Doc B')
    const bId = useDiagramStore.getState().documentId

    openDocument(aId)
    expect(useDiagramStore.getState().documentId).toBe(aId)
    expect(useDiagramStore.getState().nodes).toHaveLength(1)
    expect(getCurrentId()).toBe(aId)
    // B was saved on the way out.
    expect(loadDocumentById(bId)!.metadata.title).toBe('Doc B')
  })

  it('renameDocument updates the current doc title in-place', () => {
    const id = useDiagramStore.getState().documentId
    renameDocument(id, 'Renamed')
    expect(useDiagramStore.getState().title).toBe('Renamed')
    expect(loadDocumentById(id)!.metadata.title).toBe('Renamed')
  })

  it('renameDocument updates a NON-current doc without switching to it', () => {
    const s = useDiagramStore.getState()
    s.setTitle('Old')
    const oldId = useDiagramStore.getState().documentId
    newDocument()
    const currentId = useDiagramStore.getState().documentId

    renameDocument(oldId, 'New Name')
    expect(useDiagramStore.getState().documentId).toBe(currentId) // didn't switch
    expect(loadDocumentById(oldId)!.metadata.title).toBe('New Name')
  })

  it('removeDocument of a non-current doc just deletes it', () => {
    const oldId = useDiagramStore.getState().documentId
    newDocument()
    const currentId = useDiagramStore.getState().documentId

    removeDocument(oldId)
    expect(loadDocumentById(oldId)).toBeNull()
    expect(useDiagramStore.getState().documentId).toBe(currentId)
  })

  it('removeDocument of the current doc deletes it and opens a fresh blank one', () => {
    const s = useDiagramStore.getState()
    s.addNode('rectangle', { x: 0, y: 0 })
    const currentId = useDiagramStore.getState().documentId

    removeDocument(currentId)
    const st = useDiagramStore.getState()
    expect(loadDocumentById(currentId)).toBeNull()
    expect(st.documentId).not.toBe(currentId)
    expect(st.nodes).toHaveLength(0)
  })

  it('openDocument is a no-op when the id is already current or unknown', () => {
    const before = useDiagramStore.getState().documentId
    openDocument(before)                 // already current
    openDocument('does-not-exist')       // missing
    expect(useDiagramStore.getState().documentId).toBe(before)
  })

  it('importDocument saves the current diagram, then loads + persists the new one', () => {
    const s = useDiagramStore.getState()
    s.setTitle('Was here')
    s.addNode('rectangle', { x: 0, y: 0 })
    const prevId = useDiagramStore.getState().documentId

    const incoming = createEmptyDocument()
    incoming.metadata.title = 'Imported'
    incoming.nodes = [{ id: 'x', type: 'basic:rectangle', parentId: null, position: { x: 1, y: 2 }, size: { w: 10, h: 10 }, data: { label: 'x' } }]
    importDocument(incoming)

    const st = useDiagramStore.getState()
    expect(st.documentId).toBe(incoming.id)
    expect(st.title).toBe('Imported')
    // Previous doc preserved in the library; new doc persisted.
    expect(loadDocumentById(prevId)!.nodes).toHaveLength(1)
    expect(loadDocumentById(incoming.id)!.nodes).toHaveLength(1)
  })

  it('restoreSnapshot reverts to a snapshot after checkpointing the present state', () => {
    const s = useDiagramStore.getState()
    s.addNode('rectangle', { x: 0, y: 0 })
    const docId = useDiagramStore.getState().documentId

    // Snapshot the one-node state, then add a second node.
    saveSnapshot(docId, useDiagramStore.getState().toDocument(), { kind: 'manual', label: 'one node' })
    const snapId = listSnapshots(docId)[0].id
    useDiagramStore.getState().addNode('rectangle', { x: 50, y: 0 })
    expect(useDiagramStore.getState().nodes).toHaveLength(2)

    expect(restoreSnapshot(snapId)).toBe(true)
    expect(useDiagramStore.getState().nodes).toHaveLength(1)
    // The pre-restore (two-node) state was itself checkpointed → restore is reversible.
    expect(listSnapshots(docId).some((snap) => snap.label === 'Before restore')).toBe(true)
  })

  it('restoreSnapshot returns false for a missing snapshot', () => {
    expect(restoreSnapshot('no-such-snap')).toBe(false)
  })
})
