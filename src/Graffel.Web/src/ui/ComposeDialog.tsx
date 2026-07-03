import { useCallback, useEffect, useRef, useState } from 'react'
import { useComposeStore } from './composeStore'
import { useDialogStore } from './dialogStore'
import { useDiagramStore } from '../store/diagramStore'
import { importComposeText, resyncComposeFromText } from '../format/compose/importCompose'
import type { ComposeSyncDiff } from '../format/compose/syncCompose'

const SAMPLE = `services:
  web:
    image: nginx
    depends_on: [api]
  api:
    build: .
    depends_on: [db, cache]
  db:
    image: postgres:15
  cache:
    image: redis`

/** Strip the `compose:` id prefix for human-readable service names in the summary. */
function serviceName(id: string): string {
  return id.replace(/^compose:/, '')
}

/**
 * docker-compose dialog. Two modes, chosen by whether the current diagram was
 * generated from compose:
 *  - import  → paste/drop a file, opens as a NEW auto-laid-out diagram (slice 1).
 *  - re-sync → the stored source is pre-filled; running MERGES an updated file into
 *    the current diagram, preserving your layout, and reports what changed (slice 2).
 */
export function ComposeDialog() {
  const open = useComposeStore((s) => s.open)
  const storeClose = useComposeStore((s) => s.close)
  const source = useDiagramStore((s) => s.documentSource)
  const isResync = source?.kind === 'compose'

  // Pre-fill the re-sync source (the last-imported compose file) at mount. The
  // dialog is mounted only while open (see App.tsx), so each open is a fresh mount
  // and this initializer runs once — no effect needed, and a later re-sync mutating
  // `source` can't wipe the summary we're about to show.
  const [text, setText] = useState(() => (source?.kind === 'compose' ? (source.text ?? '') : ''))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ComposeSyncDiff | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const close = useCallback(() => {
    setText('')
    setResult(null)
    storeClose()
  }, [storeClose])

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); close() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  async function onRun() {
    setBusy(true)
    try {
      if (isResync) {
        const diff = resyncComposeFromText(text)
        setResult(diff) // keep the dialog open to show what changed
      } else {
        await importComposeText(text)
        close()
      }
    } catch (err) {
      await useDialogStore.getState().showError("Couldn't read docker-compose", (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setText(await file.text())
    inputRef.current?.focus()
  }

  return (
    <div className="graffel-dialog-overlay" data-testid="compose-overlay" onMouseDown={close}>
      <div
        className="graffel-dialog graffel-mermaid-dialog"
        role="dialog"
        aria-modal="true"
        data-testid="compose-dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="graffel-dialog-title">
          {isResync ? 'Re-sync from docker-compose' : 'Import from docker-compose'}
        </h2>
        <p className="graffel-dialog-message">
          {isResync ? (
            <>Paste your <strong>updated</strong> <code>docker-compose.yml</code>. Graffel merges it into this
            diagram — services you moved or restyled stay put, new ones are added, and removed ones drop out.</>
          ) : (
            <>Paste a <code>docker-compose.yml</code> (or choose a file). Services become shapes —
            Postgres a database, Redis a cache, Nginx a gateway — and <code>depends_on</code> becomes the
            wiring. It opens as a new, auto-laid-out diagram.</>
          )}
        </p>

        {result ? (
          <SyncSummary diff={result} />
        ) : (
          <textarea
            ref={inputRef}
            className="graffel-mermaid-text"
            data-testid="compose-input"
            placeholder={SAMPLE}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
        )}

        <div className="graffel-dialog-actions">
          {result ? (
            <button type="button" className="graffel-dialog-btn is-primary" onClick={close} data-testid="compose-done">
              Done
            </button>
          ) : (
            <>
              <label className="graffel-dialog-btn" data-testid="compose-file-label">
                Choose file…
                <input
                  type="file"
                  accept=".yml,.yaml,text/yaml"
                  style={{ display: 'none' }}
                  data-testid="compose-file"
                  onChange={(e) => void onFile(e.target.files?.[0])}
                />
              </label>
              <span style={{ flex: 1 }} />
              <button type="button" className="graffel-dialog-btn" onClick={close} data-testid="compose-close">
                Cancel
              </button>
              <button
                type="button"
                className="graffel-dialog-btn is-primary"
                onClick={() => void onRun()}
                disabled={busy || text.trim().length === 0}
                data-testid="compose-import-run"
              >
                {busy ? (isResync ? 'Syncing…' : 'Importing…') : isResync ? 'Re-sync' : 'Import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** The post-re-sync change report: +added / −removed / changed / unchanged. */
function SyncSummary({ diff }: { diff: ComposeSyncDiff }) {
  const nothing =
    diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0
  return (
    <div className="compose-sync-summary" data-testid="compose-sync-summary">
      {nothing ? (
        <p>Already up to date — nothing changed.</p>
      ) : (
        <ul>
          {diff.added.length > 0 && (
            <li data-testid="sync-added"><strong>+{diff.added.length} added</strong>: {diff.added.map(serviceName).join(', ')}</li>
          )}
          {diff.removed.length > 0 && (
            <li data-testid="sync-removed"><strong>−{diff.removed.length} removed</strong>: {diff.removed.map(serviceName).join(', ')}</li>
          )}
          {diff.changed.length > 0 && (
            <li data-testid="sync-changed"><strong>{diff.changed.length} changed</strong>: {diff.changed.map(serviceName).join(', ')}</li>
          )}
        </ul>
      )}
      <p className="compose-sync-unchanged">{diff.unchanged.length} unchanged · your layout was preserved.</p>
    </div>
  )
}
