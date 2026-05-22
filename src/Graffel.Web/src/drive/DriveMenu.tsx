import { useEffect, useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { parseDocument, serializeDocument } from '../format/graffelFile'
import {
  createFile,
  getFile,
  listFiles,
  updateFile,
  type DriveFileSummary,
} from './driveClient'

function safeName(title: string): string {
  const base = title.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'diagram'
  return base.endsWith('.graffel') ? base : `${base}.graffel`
}

export function DriveMenu() {
  const [open, setOpen] = useState<'none' | 'list'>('none')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [files, setFiles] = useState<DriveFileSummary[] | null>(null)

  const toDocument = useDiagramStore((s) => s.toDocument)
  const loadDocument = useDiagramStore((s) => s.loadDocument)
  const title = useDiagramStore((s) => s.title)
  const driveFileId = useDiagramStore((s) => s.driveFileId)
  const setDriveFileId = useDiagramStore((s) => s.setDriveFileId)

  function transientStatus(msg: string) {
    setStatus(msg)
    window.setTimeout(() => setStatus((s) => (s === msg ? null : s)), 2500)
  }

  async function saveToDrive() {
    setBusy(true)
    setStatus(null)
    try {
      const doc = toDocument()
      const name = safeName(doc.metadata.title || title)
      const body = serializeDocument(doc)
      let summary: DriveFileSummary
      if (driveFileId) {
        try {
          summary = await updateFile(driveFileId, name, body)
        } catch {
          // Fall through to create if the remote id is stale (file deleted, etc.).
          summary = await createFile(name, body)
        }
      } else {
        summary = await createFile(name, body)
      }
      // Stamp the diagram with its Drive identity for next save — without
      // resetting the rest of the store (loadDocument would clear undo history etc.).
      setDriveFileId(summary.id)
      transientStatus(`Saved to Drive`)
    } catch (e) {
      transientStatus(`Drive save failed: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function openList() {
    setBusy(true)
    try {
      const list = await listFiles()
      setFiles(list)
      setOpen('list')
    } catch (e) {
      transientStatus(`Could not list Drive: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function openOne(file: DriveFileSummary) {
    setBusy(true)
    try {
      const fetched = await getFile(file.id)
      const doc = parseDocument(fetched.body)
      // Make sure the remote identity sticks even if the file's own JSON didn't set it.
      const stamped = {
        ...doc,
        reserved: { ...doc.reserved, remote: { driveFileId: file.id } },
      }
      loadDocument(stamped)
      setOpen('none')
      transientStatus(`Loaded ${file.name}`)
    } catch (e) {
      transientStatus(`Could not open: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  // Close the open list when clicking outside it.
  useEffect(() => {
    if (open === 'none') return
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('.drive-list, .drive-list-trigger')) setOpen('none')
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [open])

  return (
    <div className="drive-menu" data-testid="drive-menu">
      <button
        type="button"
        onClick={saveToDrive}
        disabled={busy}
        data-testid="drive-save"
        title="Save the current diagram to Google Drive"
      >Save to Drive</button>
      <button
        type="button"
        className="drive-list-trigger"
        onClick={openList}
        disabled={busy}
        data-testid="drive-open"
        title="Open a diagram from Google Drive"
      >Open from Drive</button>
      {status ? <span className="drive-status" data-testid="drive-status">{status}</span> : null}
      {open === 'list' && files ? (
        <div className="drive-list" data-testid="drive-list">
          {files.length === 0 ? (
            <div className="drive-list-empty">No Graffel files in your Drive yet.</div>
          ) : (
            <ul>
              {files.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => void openOne(f)}
                    data-testid={`drive-file-${f.name}`}
                  >
                    <span className="drive-file-name">{f.name}</span>
                    <span className="drive-file-time">{new Date(f.modifiedTime).toLocaleString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
