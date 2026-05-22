import { useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { serializeDocument } from '../format/graffelFile'
import { createShare } from './shareClient'

export function ShareButton() {
  const toDocument = useDiagramStore((s) => s.toDocument)
  const driveFileId = useDiagramStore((s) => s.driveFileId)
  const title = useDiagramStore((s) => s.title)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onShare() {
    setBusy(true)
    setStatus(null)
    try {
      // Prefer snapshotting from a Drive file (smaller payload, server-authoritative).
      // Fall back to inlining the current body if there's no Drive binding yet.
      const opts = driveFileId
        ? { driveFileId, title }
        : { body: serializeDocument(toDocument()), title }
      const created = await createShare(opts)
      const absolute = new URL(created.url, window.location.origin).toString()
      try {
        await navigator.clipboard.writeText(absolute)
        setStatus('Link copied to clipboard')
      } catch {
        setStatus(absolute)
      }
      window.setTimeout(() => setStatus((s) => (s && s !== 'Link copied to clipboard' ? s : null)), 4000)
    } catch (e) {
      setStatus(`Share failed: ${(e as Error).message}`)
      window.setTimeout(() => setStatus(null), 3000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="share-menu">
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        data-testid="share-create"
        title="Create a read-only share link for this diagram"
      >Share</button>
      {status ? <span className="share-status" data-testid="share-status">{status}</span> : null}
    </span>
  )
}
