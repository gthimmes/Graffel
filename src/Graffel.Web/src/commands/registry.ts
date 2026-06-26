// The v1.4 command registry. Every entry shows up in the command palette.
// See ADR-0006.

import { useDiagramStore } from '../store/diagramStore'
import {
  parseDocument,
  serializeDocument,
} from '../format/graffelFile'
import { copyPngToClipboard, exportPng, exportSvg } from '../export/exportImage'
import { importDocument, newDocument } from '../store/documents'
import { useDialogStore } from '../ui/dialogStore'
import { useDocumentsStore } from '../ui/DocumentsDialog'
import { useMermaidStore } from '../ui/mermaidStore'
import { tidyUpCurrentLevel } from '../canvas/tidyUp'

export interface Command {
  id: string
  label: string
  keywords?: string[]
  group?: 'Insert' | 'Edit' | 'View' | 'File'
  shortcut?: string
  run: () => void | Promise<void>
}

function downloadBlob(name: string, mime: string, data: string | Blob): void {
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

function safeFilename(base: string): string {
  return base.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'diagram'
}

function viewportCenter(): { x: number; y: number } {
  // Without a hooked ReactFlow instance here, pick a sensible default offset.
  // The palette runs outside React Flow; commands that need precise placement
  // would rely on the user dragging from the palette result. For v1.4, drop at
  // a fixed point in flow space — users can move it.
  return { x: 200, y: 200 }
}

function insertNode(shapeId: string): void {
  useDiagramStore.getState().addNode(shapeId, viewportCenter())
}

export const COMMANDS: Command[] = [
  // Insert
  { id: 'insert-service',   group: 'Insert', label: 'Insert: Service',   keywords: ['add', 'shape'], run: () => insertNode('arch-core:service') },
  { id: 'insert-database',  group: 'Insert', label: 'Insert: Database',  keywords: ['add', 'shape', 'db', 'storage'], run: () => insertNode('arch-core:database') },
  { id: 'insert-queue',     group: 'Insert', label: 'Insert: Queue',     keywords: ['add', 'shape', 'message bus'], run: () => insertNode('arch-core:queue') },
  { id: 'insert-boundary',  group: 'Insert', label: 'Insert: Boundary',  keywords: ['add', 'group', 'container'], run: () => insertNode('arch-core:boundary') },
  { id: 'insert-rectangle', group: 'Insert', label: 'Insert: Rectangle', shortcut: 'R', keywords: ['add', 'rect'], run: () => insertNode('basic:rectangle') },
  { id: 'insert-ellipse',   group: 'Insert', label: 'Insert: Ellipse',   shortcut: 'E', keywords: ['add', 'oval', 'circle'], run: () => insertNode('basic:ellipse') },
  { id: 'insert-diamond',   group: 'Insert', label: 'Insert: Diamond',   shortcut: 'D', keywords: ['add', 'decision'], run: () => insertNode('basic:diamond') },
  { id: 'insert-text',      group: 'Insert', label: 'Insert: Text',      shortcut: 'T', keywords: ['add', 'label', 'note'], run: () => insertNode('basic:text') },

  // Edit
  { id: 'undo',                group: 'Edit', label: 'Undo',                shortcut: 'Cmd+Z',       run: () => useDiagramStore.getState().undo() },
  { id: 'redo',                group: 'Edit', label: 'Redo',                shortcut: 'Cmd+Shift+Z', run: () => useDiagramStore.getState().redo() },
  { id: 'select-all',          group: 'Edit', label: 'Select all',          shortcut: 'Cmd+A',       run: () => useDiagramStore.getState().selectAll() },
  { id: 'duplicate-selection', group: 'Edit', label: 'Duplicate selection', shortcut: 'Cmd+D',
    run: () => {
      const s = useDiagramStore.getState()
      if (s.selectedNodeIds.length > 0) s.duplicateNodes(s.selectedNodeIds)
    } },
  { id: 'delete-selection',    group: 'Edit', label: 'Delete selection',    shortcut: 'Delete', run: () => useDiagramStore.getState().removeSelection() },

  // View
  { id: 'view-tidy-up', group: 'View', label: 'Tidy up (auto-layout)', keywords: ['arrange', 'layout', 'organize', 'clean', 'elk', 'auto'],
    run: () => { void tidyUpCurrentLevel() } },

  // File
  { id: 'file-new', group: 'File', label: 'New diagram', keywords: ['clear', 'blank'], run: () => newDocument() },
  { id: 'documents-open', group: 'File', label: 'Documents…', keywords: ['library', 'files', 'switch', 'recent'], run: () => useDocumentsStore.getState().open() },
  { id: 'mermaid-import', group: 'File', label: 'Import from Mermaid…', keywords: ['mermaid', 'markdown', 'text', 'flowchart', 'paste'], run: () => useMermaidStore.getState().openImport() },
  { id: 'mermaid-export', group: 'File', label: 'Export to Mermaid…', keywords: ['mermaid', 'markdown', 'text', 'flowchart', 'code'], run: () => useMermaidStore.getState().openExport() },
  { id: 'file-download', group: 'File', label: 'Download .graffel', keywords: ['save', 'export', 'json'],
    run: () => {
      const doc = useDiagramStore.getState().toDocument()
      downloadBlob(`${safeFilename(doc.metadata.title)}.graffel`, 'application/json', serializeDocument(doc))
    } },
  { id: 'file-open', group: 'File', label: 'Open .graffel…', keywords: ['load', 'import'],
    run: () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.graffel,application/json'
      input.addEventListener('change', async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          importDocument(parseDocument(await file.text()))
        } catch (err) {
          void useDialogStore.getState().showError('Could not open file', (err as Error).message)
        }
      })
      input.click()
    } },

  // Export
  { id: 'export-png', group: 'File', label: 'Export PNG', keywords: ['image', 'raster'],
    run: async () => {
      const dataUrl = await exportPng()
      if (!dataUrl) return
      const title = useDiagramStore.getState().title
      downloadBlob(`${safeFilename(title)}.png`, 'image/png', await (await fetch(dataUrl)).blob())
    } },
  { id: 'copy-png', group: 'File', label: 'Copy as image', keywords: ['clipboard', 'png', 'screenshot', 'slack'],
    run: async () => { await copyPngToClipboard() } },
  { id: 'export-svg', group: 'File', label: 'Export SVG', keywords: ['vector', 'image'],
    run: async () => {
      const dataUrl = await exportSvg()
      if (!dataUrl) return
      const title = useDiagramStore.getState().title
      downloadBlob(`${safeFilename(title)}.svg`, 'image/svg+xml', await (await fetch(dataUrl)).blob())
    } },
]

export function findCommand(id: string): Command | undefined {
  return COMMANDS.find((c) => c.id === id)
}
