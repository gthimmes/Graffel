import { useRef } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { useToolStore } from '../canvas/toolStore'
import { AuthMenu } from '../auth/AuthMenu'
import { useAuth } from '../auth/useAuth'
import { DriveMenu } from '../drive/DriveMenu'
import { ShareButton } from '../share/ShareButton'
import {
  parseDocument,
  serializeDocument,
} from '../format/graffelFile'
import { exportPng, exportSvg } from '../export/exportImage'

function downloadBlob(name: string, mime: string, data: string | Blob) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function Toolbar() {
  const { status: authStatus } = useAuth()
  const title = useDiagramStore((s) => s.title)
  const setTitle = useDiagramStore((s) => s.setTitle)
  const toDocument = useDiagramStore((s) => s.toDocument)
  const loadDocument = useDiagramStore((s) => s.loadDocument)
  const reset = useDiagramStore((s) => s.reset)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  // canUndo/canRedo are functions; subscribe to the history slice directly to re-render.
  const pastLen = useDiagramStore((s) => s._past.length)
  const futureLen = useDiagramStore((s) => s._future.length)
  const snapGrid = useDiagramStore((s) => s.snapGrid)
  const setSnapGrid = useDiagramStore((s) => s.setSnapGrid)
  const tool = useToolStore((s) => s.tool)
  const setTool = useToolStore((s) => s.setTool)
  const fileInput = useRef<HTMLInputElement>(null)

  function safeFilename(base: string): string {
    return base.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'diagram'
  }

  function onDownload() {
    const doc = toDocument()
    downloadBlob(`${safeFilename(doc.metadata.title)}.graffel`, 'application/json', serializeDocument(doc))
  }

  function onOpenClick() {
    fileInput.current?.click()
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const doc = parseDocument(text)
      loadDocument(doc)
    } catch (err) {
      alert(`Could not open file: ${(err as Error).message}`)
    } finally {
      e.target.value = ''
    }
  }

  async function onExportPng() {
    const dataUrl = await exportPng()
    if (!dataUrl) return
    downloadBlob(`${safeFilename(title)}.png`, 'image/png', await (await fetch(dataUrl)).blob())
  }

  async function onExportSvg() {
    const dataUrl = await exportSvg()
    if (!dataUrl) return
    downloadBlob(`${safeFilename(title)}.svg`, 'image/svg+xml', await (await fetch(dataUrl)).blob())
  }

  function onNew() {
    if (confirm('Discard current diagram and start a new one?')) reset()
  }

  return (
    <header className="graffel-toolbar" data-testid="toolbar">
      <span className="brand">Graffel</span>
      <input
        className="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        data-testid="title-input"
        aria-label="Diagram title"
      />
      <span className="spacer" />
      <div className="tool-group" role="radiogroup" aria-label="Pointer tool">
        <button
          type="button"
          onClick={() => setTool('select')}
          title="Select tool (V) — drag to rubber-band select"
          aria-pressed={tool === 'select'}
          data-testid="tool-select"
          className={tool === 'select' ? 'toolbar-toggle on' : 'toolbar-toggle'}
        >▣ Select</button>
        <button
          type="button"
          onClick={() => setTool('pan')}
          title="Hand tool (H) — drag to pan"
          aria-pressed={tool === 'pan'}
          data-testid="tool-pan"
          className={tool === 'pan' ? 'toolbar-toggle on' : 'toolbar-toggle'}
        >✋ Hand</button>
      </div>
      <span className="toolbar-divider" />
      <button
        type="button"
        onClick={undo}
        disabled={pastLen === 0}
        title="Undo (Cmd/Ctrl+Z)"
        data-testid="action-undo"
      >↶ Undo</button>
      <button
        type="button"
        onClick={redo}
        disabled={futureLen === 0}
        title="Redo (Cmd/Ctrl+Shift+Z)"
        data-testid="action-redo"
      >↷ Redo</button>
      <button
        type="button"
        onClick={() => setSnapGrid(!snapGrid)}
        title="Snap to grid (Cmd/Ctrl+;)"
        aria-pressed={snapGrid}
        data-testid="action-snap-grid"
        className={snapGrid ? 'toolbar-toggle on' : 'toolbar-toggle'}
      >⌗ Grid</button>
      <button type="button" onClick={onNew} data-testid="action-new">New</button>
      <button type="button" onClick={onOpenClick} data-testid="action-open">Open…</button>
      <button type="button" onClick={onDownload} data-testid="action-download">Download .graffel</button>
      <button type="button" onClick={onExportPng} data-testid="action-export-png">Export PNG</button>
      <button type="button" onClick={onExportSvg} data-testid="action-export-svg">Export SVG</button>
      {authStatus === 'signed-in' ? (
        <>
          <span className="toolbar-divider" />
          <DriveMenu />
          <ShareButton />
        </>
      ) : null}
      <span className="toolbar-divider" />
      <AuthMenu />
      <input
        ref={fileInput}
        type="file"
        accept=".graffel,application/json,application/octet-stream"
        style={{ display: 'none' }}
        onChange={onFileChosen}
        data-testid="open-file-input"
      />
    </header>
  )
}
