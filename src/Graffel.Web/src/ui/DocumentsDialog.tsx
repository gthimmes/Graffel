import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { useDiagramStore } from '../store/diagramStore'
import { listDocuments, type LibraryEntry } from '../store/persistence'
import { newDocument, openDocument, removeDocument, renameDocument } from '../store/documents'
import { useDialogStore } from './dialogStore'

interface DocumentsUiState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useDocumentsStore = create<DocumentsUiState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export function DocumentsDialog() {
  const isOpen = useDocumentsStore((s) => s.isOpen)
  const close = useDocumentsStore((s) => s.close)
  // Re-list whenever the current doc/title changes or the dialog (re)opens.
  const currentId = useDiagramStore((s) => s.documentId)
  const currentTitle = useDiagramStore((s) => s.title)
  const [docs, setDocs] = useState<LibraryEntry[]>([])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (isOpen) setDocs(listDocuments())
  }, [isOpen, currentId, currentTitle])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && renamingId === null) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close, renamingId])

  if (!isOpen) return null

  const refresh = () => setDocs(listDocuments())

  function onOpen(id: string) {
    openDocument(id)
    close()
  }
  function onNew() {
    newDocument()
    close()
  }
  function commitRename(id: string) {
    const name = draft.trim()
    if (name) renameDocument(id, name)
    setRenamingId(null)
    refresh()
  }
  async function onDelete(entry: LibraryEntry) {
    const ok = await useDialogStore.getState().ask({
      title: 'Delete diagram?',
      message: `"${entry.title || 'Untitled diagram'}" will be permanently removed. This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    removeDocument(entry.id)
    refresh()
  }

  return (
    <div className="graffel-dialog-overlay" data-testid="documents-overlay" onMouseDown={close}>
      <div
        className="graffel-dialog graffel-documents"
        role="dialog"
        aria-modal="true"
        data-testid="documents-dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="graffel-documents-head">
          <h2 className="graffel-dialog-title">Documents</h2>
          <button type="button" className="graffel-dialog-btn is-primary" onClick={onNew} data-testid="doc-new">
            + New diagram
          </button>
        </div>

        <ul className="graffel-documents-list">
          {docs.length === 0 ? (
            <li className="graffel-documents-empty">No saved diagrams yet.</li>
          ) : (
            docs.map((d) => (
              <li
                key={d.id}
                className={`graffel-doc-row${d.id === currentId ? ' is-current' : ''}`}
                data-testid={`doc-row-${d.id}`}
              >
                {renamingId === d.id ? (
                  <input
                    className="graffel-doc-rename-input"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commitRename(d.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitRename(d.id) }
                      if (e.key === 'Escape') { e.preventDefault(); setRenamingId(null) }
                    }}
                    data-testid={`doc-rename-input-${d.id}`}
                  />
                ) : (
                  <button type="button" className="graffel-doc-title" onClick={() => onOpen(d.id)} data-testid={`doc-open-${d.id}`}>
                    <span className="graffel-doc-name">{d.title || 'Untitled diagram'}</span>
                    <span className="graffel-doc-time">{relativeTime(d.updatedAt)}{d.id === currentId ? ' · open' : ''}</span>
                  </button>
                )}
                <div className="graffel-doc-actions">
                  <button
                    type="button"
                    className="graffel-doc-icon"
                    title="Rename"
                    onClick={() => { setRenamingId(d.id); setDraft(d.title) }}
                    data-testid={`doc-rename-${d.id}`}
                  >✎</button>
                  <button
                    type="button"
                    className="graffel-doc-icon is-danger"
                    title="Delete"
                    onClick={() => void onDelete(d)}
                    data-testid={`doc-delete-${d.id}`}
                  >×</button>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="graffel-documents-foot">
          <button type="button" className="graffel-dialog-btn" onClick={close} data-testid="documents-close">Close</button>
        </div>
      </div>
    </div>
  )
}
