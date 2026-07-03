import { beforeEach, describe, expect, it } from 'vitest'
import { tidyUpCurrentLevel } from './tidyUp'
import { useDiagramStore } from '../store/diagramStore'

describe('tidyUpCurrentLevel', () => {
  beforeEach(() => {
    useDiagramStore.getState().reset()
    useDiagramStore.setState({ readOnly: false })
  })

  it('is a no-op (returns false) with fewer than two nodes', async () => {
    expect(await tidyUpCurrentLevel()).toBe(false)
    useDiagramStore.getState().addNode('basic:rectangle', { x: 0, y: 0 })
    expect(await tidyUpCurrentLevel()).toBe(false)
  })

  it('does nothing in read-only mode even with a laid-out graph', async () => {
    const a = useDiagramStore.getState().addNode('basic:rectangle', { x: 0, y: 0 })
    const b = useDiagramStore.getState().addNode('basic:rectangle', { x: 0, y: 0 })
    useDiagramStore.getState().addEdge(a, b, { sourceHandle: 'right', targetHandle: 'left' })
    useDiagramStore.setState({ readOnly: true })

    expect(await tidyUpCurrentLevel()).toBe(false)
    const nodes = useDiagramStore.getState().nodes
    expect(nodes.every((n) => n.position.x === 0 && n.position.y === 0)).toBe(true)
  })

  it('lays out the current level and applies it as one undoable step', async () => {
    const a = useDiagramStore.getState().addNode('basic:rectangle', { x: 0, y: 0 })
    const b = useDiagramStore.getState().addNode('basic:rectangle', { x: 0, y: 0 })
    useDiagramStore.getState().addEdge(a, b, { sourceHandle: 'right', targetHandle: 'left' })

    const ok = await tidyUpCurrentLevel()
    expect(ok).toBe(true)

    // ELK separates the two overlapping nodes.
    const nodes = useDiagramStore.getState().nodes
    const pa = nodes.find((n) => n.id === a)!.position
    const pb = nodes.find((n) => n.id === b)!.position
    expect(pa).not.toEqual(pb)

    // One undo step reverts the whole layout.
    expect(useDiagramStore.getState().canUndo()).toBe(true)
    useDiagramStore.getState().undo()
    const reverted = useDiagramStore.getState().nodes
    expect(reverted.every((n) => n.position.x === 0 && n.position.y === 0)).toBe(true)
  })
})
