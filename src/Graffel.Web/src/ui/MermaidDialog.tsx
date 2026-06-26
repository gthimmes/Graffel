import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMermaidStore } from './mermaidStore'
import { useDialogStore } from './dialogStore'
import { exportCurrentLevelMermaid, importMermaidText } from '../format/mermaid/importMermaid'

const SAMPLE = `graph TD
  Browser[Web App] --> API{Auth?}
  API -->|yes| Service[Orders Service]
  Service --> DB[(Database)]`

function downloadBlob(name: string, mime: string, data: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Mermaid import (paste & convert) / export (read, copy, download) dialog. */
export function MermaidDialog() {
  const mode = useMermaidStore((s) => s.mode)
  const storeClose = useMermaidStore((s) => s.close)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const importRef = useRef<HTMLTextAreaElement>(null)

  // Snapshot the current level's Mermaid once per open of the export dialog.
  const exportText = useMemo(() => (mode === 'export' ? exportCurrentLevelMermaid() : ''), [mode])

  const close = useCallback(() => {
    setText('')
    storeClose()
  }, [storeClose])

  useEffect(() => {
    if (mode === 'import') {
      const t = window.setTimeout(() => importRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
  }, [mode])

  useEffect(() => {
    if (!mode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); close() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, close])

  if (!mode) return null

  async function onImport() {
    setBusy(true)
    try {
      await importMermaidText(text)
      close()
    } catch (err) {
      await useDialogStore.getState().showError("Couldn't import Mermaid", (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the textarea is selectable as a fallback */
    }
  }

  const isImport = mode === 'import'
  return (
    <div className="graffel-dialog-overlay" data-testid="mermaid-overlay" onMouseDown={close}>
      <div
        className="graffel-dialog graffel-mermaid-dialog"
        role="dialog"
        aria-modal="true"
        data-testid="mermaid-dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="graffel-dialog-title">{isImport ? 'Import from Mermaid' : 'Export to Mermaid'}</h2>
        <p className="graffel-dialog-message">
          {isImport
            ? 'Paste a Mermaid flowchart (graph / flowchart). It opens as a new, auto-laid-out diagram.'
            : 'Mermaid for the level you’re viewing. Copy it into Markdown, a wiki, or a README.'}
        </p>

        {isImport ? (
          <textarea
            ref={importRef}
            className="graffel-mermaid-text"
            data-testid="mermaid-input"
            placeholder={SAMPLE}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <textarea
            className="graffel-mermaid-text"
            data-testid="mermaid-output"
            value={exportText}
            readOnly
            spellCheck={false}
            onFocus={(e) => e.currentTarget.select()}
          />
        )}

        <div className="graffel-dialog-actions">
          <button type="button" className="graffel-dialog-btn" onClick={close} data-testid="mermaid-close">
            {isImport ? 'Cancel' : 'Close'}
          </button>
          {isImport ? (
            <button
              type="button"
              className="graffel-dialog-btn is-primary"
              onClick={() => void onImport()}
              disabled={busy || text.trim().length === 0}
              data-testid="mermaid-import-run"
            >
              {busy ? 'Importing…' : 'Import'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="graffel-dialog-btn"
                onClick={() => downloadBlob('diagram.mmd', 'text/vnd.mermaid', exportText)}
                data-testid="mermaid-download"
              >
                Download .mmd
              </button>
              <button
                type="button"
                className="graffel-dialog-btn is-primary"
                onClick={() => void onCopy()}
                data-testid="mermaid-copy"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
