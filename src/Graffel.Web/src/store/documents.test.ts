import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'
import { getCurrentId, listDocuments, loadDocumentById } from './persistence'
import { newDocument, openDocument, removeDocument, renameDocument } from './documents'

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
})
