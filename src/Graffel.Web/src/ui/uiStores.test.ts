import { describe, expect, it } from 'vitest'
import { useSaveStatusStore } from './saveStatusStore'
import { useHistoryUiStore } from './historyUiStore'
import { useTourUiStore } from './tourUiStore'
import { useMermaidStore } from './mermaidStore'
import { useComposeStore } from './composeStore'
import { useToolStore } from '../canvas/toolStore'
import { useEdgeMenuStore } from '../canvas/edgeMenuStore'
import { useNodeMenuStore } from '../canvas/nodeMenuStore'

// Small zustand UI stores. Individually trivial, but they drive real interactions
// (context menus, the save indicator, panel toggles), so a compact behavioural
// sweep guards against a broken open/close/toggle contract.

describe('saveStatusStore', () => {
  it('markSaving → saving; markSaved → saved with a timestamp', () => {
    useSaveStatusStore.getState().markSaving()
    expect(useSaveStatusStore.getState().status).toBe('saving')

    useSaveStatusStore.getState().markSaved(123)
    expect(useSaveStatusStore.getState()).toMatchObject({ status: 'saved', lastSavedAt: 123 })
  })

  it('markSaved() without an argument stamps a real time', () => {
    useSaveStatusStore.getState().markSaved()
    expect(useSaveStatusStore.getState().lastSavedAt).toBeTypeOf('number')
  })
})

describe('historyUiStore', () => {
  it('opens, closes, toggles, and bumps a version counter', () => {
    const s = () => useHistoryUiStore.getState()
    s().openPanel();  expect(s().open).toBe(true)
    s().closePanel(); expect(s().open).toBe(false)
    s().togglePanel(); expect(s().open).toBe(true)
    s().togglePanel(); expect(s().open).toBe(false)

    const before = s().version
    s().bump()
    expect(s().version).toBe(before + 1)
  })
})

describe('tourUiStore', () => {
  it('toggles the authoring panel', () => {
    const s = () => useTourUiStore.getState()
    s().openPanel(); expect(s().panelOpen).toBe(true)
    s().togglePanel(); expect(s().panelOpen).toBe(false)
    s().closePanel(); expect(s().panelOpen).toBe(false)
  })
})

describe('mermaid & compose dialog stores', () => {
  it('mermaid opens in import/export mode and closes to null', () => {
    useMermaidStore.getState().openImport()
    expect(useMermaidStore.getState().mode).toBe('import')
    useMermaidStore.getState().openExport()
    expect(useMermaidStore.getState().mode).toBe('export')
    useMermaidStore.getState().close()
    expect(useMermaidStore.getState().mode).toBeNull()
  })

  it('compose opens and closes', () => {
    useComposeStore.getState().openImport()
    expect(useComposeStore.getState().open).toBe(true)
    useComposeStore.getState().close()
    expect(useComposeStore.getState().open).toBe(false)
  })
})

describe('toolStore', () => {
  it('switches the pointer tool', () => {
    useToolStore.getState().setTool('pan')
    expect(useToolStore.getState().tool).toBe('pan')
    useToolStore.getState().setTool('select')
    expect(useToolStore.getState().tool).toBe('select')
  })
})

describe('context-menu stores', () => {
  it('edge menu opens at a position (with the edge id) and closes', () => {
    useEdgeMenuStore.getState().openAt('e1', 10, 20)
    expect(useEdgeMenuStore.getState().open).toEqual({ edgeId: 'e1', x: 10, y: 20 })
    useEdgeMenuStore.getState().close()
    expect(useEdgeMenuStore.getState().open).toBeNull()
  })

  it('node menu opens at a position and closes', () => {
    useNodeMenuStore.getState().openAt(5, 6)
    expect(useNodeMenuStore.getState().open).toEqual({ x: 5, y: 6 })
    useNodeMenuStore.getState().close()
    expect(useNodeMenuStore.getState().open).toBeNull()
  })
})
