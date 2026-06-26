import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'
import { createEmptyDocument } from '../format/graffelFile'
import type { GraffelNode } from '../format/types'

function reset() {
  useDiagramStore.getState().reset()
}

/** A small diagram: a container c1 holding child a, plus a top-level node b. */
function seed() {
  const s = useDiagramStore.getState()
  const nodes: GraffelNode[] = [
    { id: 'c1', type: 'basic:group', parentId: null, position: { x: 0, y: 0 }, size: { w: 300, h: 200 }, data: { label: 'Cluster' } },
    { id: 'a', type: 'arch-core:service', parentId: 'c1', position: { x: 20, y: 20 }, size: { w: 120, h: 80 }, data: { label: 'Auth' } },
    { id: 'b', type: 'arch-core:database', parentId: null, position: { x: 400, y: 0 }, size: { w: 120, h: 80 }, data: { label: 'DB' } },
  ]
  const doc = createEmptyDocument()
  doc.nodes = nodes
  s.loadDocument(doc)
}

describe('diagram store — walkthrough', () => {
  beforeEach(() => { reset(); seed() })

  it('addTourStop captures the current level and selection', () => {
    const s = useDiagramStore.getState()
    s.enterContainer('c1')
    s.selectNodes(['a'])
    const id = s.addTourStop()
    const stops = useDiagramStore.getState().tourStops
    expect(stops).toHaveLength(1)
    expect(stops[0]!.id).toBe(id)
    expect(stops[0]!.viewRootId).toBe('c1')
    expect(stops[0]!.selectedNodeIds).toEqual(['a'])
    expect(stops[0]!.title).toBe('Stop 1')
  })

  it('updateTourStop edits title and note', () => {
    const id = useDiagramStore.getState().addTourStop()
    useDiagramStore.getState().updateTourStop(id, { title: 'Intro', note: 'Start here.' })
    const stop = useDiagramStore.getState().tourStops[0]!
    expect(stop.title).toBe('Intro')
    expect(stop.note).toBe('Start here.')
  })

  it('removeTourStop drops the stop', () => {
    const id = useDiagramStore.getState().addTourStop()
    useDiagramStore.getState().removeTourStop(id)
    expect(useDiagramStore.getState().tourStops).toHaveLength(0)
  })

  it('moveTourStop reorders stops', () => {
    const s = useDiagramStore.getState()
    const first = s.addTourStop()
    const second = s.addTourStop()
    s.moveTourStop(second, -1)
    expect(useDiagramStore.getState().tourStops.map((x) => x.id)).toEqual([second, first])
  })

  it('startPresenting applies the first stop (level + selection)', () => {
    const s = useDiagramStore.getState()
    // Stop 0 at root selecting b; stop 1 inside c1 selecting a.
    s.selectNodes(['b'])
    s.addTourStop()
    s.enterContainer('c1')
    s.selectNodes(['a'])
    s.addTourStop()
    s.exitToLevel(null)
    s.selectNodes([])

    s.startPresenting()
    const after = useDiagramStore.getState()
    expect(after.presenting).toBe(true)
    expect(after.presentIndex).toBe(0)
    expect(after.viewRootId).toBeNull()
    expect(after.selectedNodeIds).toEqual(['b'])
  })

  it('nextStop / prevStop navigate and clamp', () => {
    const s = useDiagramStore.getState()
    s.selectNodes(['b']); s.addTourStop()
    s.enterContainer('c1'); s.selectNodes(['a']); s.addTourStop()
    s.exitToLevel(null)
    s.startPresenting()

    s.nextStop()
    let st = useDiagramStore.getState()
    expect(st.presentIndex).toBe(1)
    expect(st.viewRootId).toBe('c1')
    expect(st.selectedNodeIds).toEqual(['a'])

    // Clamp at the end.
    s.nextStop()
    expect(useDiagramStore.getState().presentIndex).toBe(1)

    s.prevStop()
    st = useDiagramStore.getState()
    expect(st.presentIndex).toBe(0)
    expect(st.viewRootId).toBeNull()
    // Clamp at the start.
    s.prevStop()
    expect(useDiagramStore.getState().presentIndex).toBe(0)
  })

  it('startPresenting is a no-op with no stops', () => {
    useDiagramStore.getState().startPresenting()
    expect(useDiagramStore.getState().presenting).toBe(false)
  })

  it('stopPresenting exits presentation', () => {
    const s = useDiagramStore.getState()
    s.addTourStop()
    s.startPresenting()
    s.stopPresenting()
    expect(useDiagramStore.getState().presenting).toBe(false)
  })

  it('a stop whose level was deleted resolves to root on playback', () => {
    const s = useDiagramStore.getState()
    s.enterContainer('c1'); s.selectNodes(['a']); s.addTourStop()
    s.exitToLevel(null)
    // Delete the container (and its child).
    s.selectNodes(['c1']); s.removeSelection()
    s.startPresenting()
    const st = useDiagramStore.getState()
    expect(st.viewRootId).toBeNull()
    expect(st.selectedNodeIds).toEqual([])
  })

  it('toDocument includes presentation; loadDocument restores it and resets playback', () => {
    const s = useDiagramStore.getState()
    s.selectNodes(['b'])
    s.addTourStop()
    s.startPresenting()
    const doc = useDiagramStore.getState().toDocument()
    expect(doc.presentation?.stops).toHaveLength(1)
    expect(doc.presentation?.stops[0]!.selectedNodeIds).toEqual(['b'])

    reset()
    useDiagramStore.getState().loadDocument(doc)
    const st = useDiagramStore.getState()
    expect(st.tourStops).toHaveLength(1)
    expect(st.presenting).toBe(false)
    expect(st.presentIndex).toBe(0)
  })

  it('omits presentation from toDocument when there are no stops', () => {
    expect(useDiagramStore.getState().toDocument().presentation).toBeUndefined()
  })

  it('read-only blocks authoring but allows presenting', () => {
    const s = useDiagramStore.getState()
    s.selectNodes(['b'])
    s.addTourStop() // author one while editable
    s.setReadOnly(true)
    s.addTourStop() // blocked
    expect(useDiagramStore.getState().tourStops).toHaveLength(1)
    s.startPresenting() // navigation — allowed
    expect(useDiagramStore.getState().presenting).toBe(true)
  })
})
