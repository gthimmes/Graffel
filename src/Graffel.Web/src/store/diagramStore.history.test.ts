import { beforeEach, describe, expect, it } from 'vitest'
import { useDiagramStore } from './diagramStore'

function reset() { useDiagramStore.getState().reset() }

describe('diagramStore — history (v1.3)', () => {
  beforeEach(reset)

  it('starts with canUndo=false and canRedo=false', () => {
    expect(useDiagramStore.getState().canUndo()).toBe(false)
    expect(useDiagramStore.getState().canRedo()).toBe(false)
  })

  it('after addNode, canUndo is true and undo removes the node', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    expect(useDiagramStore.getState().nodes).toHaveLength(1)
    expect(useDiagramStore.getState().canUndo()).toBe(true)
    useDiagramStore.getState().undo()
    expect(useDiagramStore.getState().nodes).toHaveLength(0)
    expect(useDiagramStore.getState().canUndo()).toBe(false)
    expect(useDiagramStore.getState().canRedo()).toBe(true)
  })

  it('redo replays an undone action', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    useDiagramStore.getState().undo()
    expect(useDiagramStore.getState().nodes).toHaveLength(0)
    useDiagramStore.getState().redo()
    expect(useDiagramStore.getState().nodes).toHaveLength(1)
    expect(useDiagramStore.getState().nodes[0]!.type).toBe('service')
  })

  it('a new action after undo clears the redo stack', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    useDiagramStore.getState().undo()
    expect(useDiagramStore.getState().canRedo()).toBe(true)
    useDiagramStore.getState().addNode('database', { x: 100, y: 0 })
    expect(useDiagramStore.getState().canRedo()).toBe(false)
  })

  it('undo works for removals', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    const id = useDiagramStore.getState().nodes[0]!.id
    useDiagramStore.getState().selectNodes([id])
    useDiagramStore.getState().removeSelection()
    expect(useDiagramStore.getState().nodes).toHaveLength(0)
    useDiagramStore.getState().undo()
    expect(useDiagramStore.getState().nodes).toHaveLength(1)
    expect(useDiagramStore.getState().nodes[0]!.id).toBe(id)
  })

  it('undo works for style changes', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    const id = useDiagramStore.getState().nodes[0]!.id
    useDiagramStore.getState().updateNodeStyle(id, { fontSize: 22 })
    const styleBefore = useDiagramStore.getState().nodes[0]!.data.style as { fontSize?: number }
    expect(styleBefore.fontSize).toBe(22)
    useDiagramStore.getState().undo()
    const styleAfter = useDiagramStore.getState().nodes[0]!.data.style as { fontSize?: number } | undefined
    expect(styleAfter?.fontSize).toBeUndefined()
  })

  it('consecutive position updates for the same node coalesce into one history entry', () => {
    useDiagramStore.getState().addNode('rectangle', { x: 0, y: 0 })
    const id = useDiagramStore.getState().nodes[0]!.id
    // Three rapid moves — they should collapse into one undo step.
    useDiagramStore.getState().updateNodePosition(id, { x: 10, y: 0 })
    useDiagramStore.getState().updateNodePosition(id, { x: 20, y: 0 })
    useDiagramStore.getState().updateNodePosition(id, { x: 30, y: 0 })
    expect(useDiagramStore.getState().nodes[0]!.position.x).toBe(30)
    useDiagramStore.getState().undo() // should pop the coalesced drag (position back to 0)
    expect(useDiagramStore.getState().nodes[0]!.position.x).toBe(0)
  })

  it('selecting nodes/edges does NOT push history', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    const id = useDiagramStore.getState().nodes[0]!.id
    useDiagramStore.getState().selectNodes([id])
    useDiagramStore.getState().selectNodes([])
    // One history entry: the addNode. Selection didn't push.
    useDiagramStore.getState().undo()
    expect(useDiagramStore.getState().nodes).toHaveLength(0)
    expect(useDiagramStore.getState().canUndo()).toBe(false)
  })

  it('reset() clears the history stacks', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    useDiagramStore.getState().reset()
    expect(useDiagramStore.getState().canUndo()).toBe(false)
    expect(useDiagramStore.getState().canRedo()).toBe(false)
  })

  it('loadDocument does not leak prior history', () => {
    useDiagramStore.getState().addNode('service', { x: 0, y: 0 })
    const doc = useDiagramStore.getState().toDocument()
    useDiagramStore.getState().reset()
    useDiagramStore.getState().loadDocument(doc)
    // After load, there is nothing to undo back to (we just opened a file).
    expect(useDiagramStore.getState().canUndo()).toBe(false)
  })
})
