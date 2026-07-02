import { useRef, useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { useToolStore } from '../canvas/toolStore'
import { tidyUpCurrentLevel } from '../canvas/tidyUp'
import { resolvePref, useThemeStore } from './themeStore'
import { copyPngToClipboard } from '../export/exportImage'
import { AuthMenu } from '../auth/AuthMenu'
import { useAuth } from '../auth/useAuth'
import { DriveMenu } from '../drive/DriveMenu'
import { ShareButton } from '../share/ShareButton'
import {
  parseDocument,
  serializeDocument,
} from '../format/graffelFile'
import { exportPng, exportSvg } from '../export/exportImage'
import { importDocument, newDocument } from '../store/documents'
import { useDialogStore } from './dialogStore'
import { useDocumentsStore } from './DocumentsDialog'
import { useTourUiStore } from './tourUiStore'
import { useMermaidStore } from './mermaidStore'
import { useHistoryUiStore } from './historyUiStore'
import { SaveStatus } from './SaveStatus'

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
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  // canUndo/canRedo are functions; subscribe to the history slice directly to re-render.
  const pastLen = useDiagramStore((s) => s._past.length)
  const futureLen = useDiagramStore((s) => s._future.length)
  const snapGrid = useDiagramStore((s) => s.snapGrid)
  const setSnapGrid = useDiagramStore((s) => s.setSnapGrid)
  const tool = useToolStore((s) => s.tool)
  const setTool = useToolStore((s) => s.setTool)
  const tourPanelOpen = useTourUiStore((s) => s.panelOpen)
  const toggleTourPanel = useTourUiStore((s) => s.togglePanel)
  const historyOpen = useHistoryUiStore((s) => s.open)
  const themePref = useThemeStore((s) => s.pref)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const isDark = resolvePref(themePref) === 'dark'
  const fileInput = useRef<HTMLInputElement>(null)
  const [copiedPng, setCopiedPng] = useState(false)

  async function onCopyPng() {
    if (await copyPngToClipboard()) {
      setCopiedPng(true)
      window.setTimeout(() => setCopiedPng(false), 1500)
    }
  }

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
      importDocument(parseDocument(text))
    } catch (err) {
      void useDialogStore.getState().showError('Could not open file', (err as Error).message)
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

  // "New" is non-destructive now: the current diagram is saved to the library
  // and a fresh one opens. No confirmation needed.
  function onNew() {
    newDocument()
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
      <SaveStatus />
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
      <button
        type="button"
        onClick={() => void tidyUpCurrentLevel()}
        title="Tidy up — auto-arrange the shapes at this level"
        data-testid="action-tidy-up"
      >✨ Tidy up</button>
      <button
        type="button"
        onClick={toggleTourPanel}
        title="Walkthrough — author a guided tour and present it"
        aria-pressed={tourPanelOpen}
        data-testid="action-tour"
        className={tourPanelOpen ? 'toolbar-toggle on' : 'toolbar-toggle'}
      >🎬 Present</button>
      <button
        type="button"
        onClick={() => useHistoryUiStore.getState().togglePanel()}
        title="Version history — snapshots you can restore"
        aria-pressed={historyOpen}
        data-testid="action-history"
        className={historyOpen ? 'toolbar-toggle on' : 'toolbar-toggle'}
      >🕘 History</button>
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-pressed={isDark}
        data-testid="action-theme-toggle"
        className="toolbar-toggle"
      >{isDark ? '☀️ Light' : '🌙 Dark'}</button>
      <button type="button" onClick={onNew} data-testid="action-new">New</button>
      <button type="button" onClick={() => useDocumentsStore.getState().open()} data-testid="action-documents">Documents</button>
      <button type="button" onClick={onOpenClick} data-testid="action-open">Open…</button>
      <button
        type="button"
        onClick={() => useMermaidStore.getState().openImport()}
        title="Import a Mermaid flowchart as a new diagram"
        data-testid="action-mermaid"
      >⇄ Mermaid</button>
      <button type="button" onClick={onDownload} data-testid="action-download">Download .graffel</button>
      <button type="button" onClick={onExportPng} data-testid="action-export-png">Export PNG</button>
      <button
        type="button"
        onClick={() => void onCopyPng()}
        title="Copy the current view to the clipboard as a PNG"
        data-testid="action-copy-png"
      >{copiedPng ? '✓ Copied!' : 'Copy image'}</button>
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
