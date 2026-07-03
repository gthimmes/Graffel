import { useCallback, useEffect, useRef, useState } from 'react'
import { useComposeStore } from './composeStore'
import { useDialogStore } from './dialogStore'
import { importComposeText } from '../format/compose/importCompose'

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

/** docker-compose import dialog: paste or drop a compose file → a laid-out diagram. */
export function ComposeDialog() {
  const open = useComposeStore((s) => s.open)
  const storeClose = useComposeStore((s) => s.close)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const close = useCallback(() => {
    setText('')
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

  async function onImport() {
    setBusy(true)
    try {
      await importComposeText(text)
      close()
    } catch (err) {
      await useDialogStore.getState().showError("Couldn't import docker-compose", (err as Error).message)
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
        <h2 className="graffel-dialog-title">Import from docker-compose</h2>
        <p className="graffel-dialog-message">
          Paste a <code>docker-compose.yml</code> (or choose a file). Services become
          shapes — Postgres a database, Redis a cache, Nginx a gateway — and{' '}
          <code>depends_on</code> becomes the wiring. It opens as a new, auto-laid-out diagram.
        </p>

        <textarea
          ref={inputRef}
          className="graffel-mermaid-text"
          data-testid="compose-input"
          placeholder={SAMPLE}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />

        <div className="graffel-dialog-actions">
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
            onClick={() => void onImport()}
            disabled={busy || text.trim().length === 0}
            data-testid="compose-import-run"
          >
            {busy ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
