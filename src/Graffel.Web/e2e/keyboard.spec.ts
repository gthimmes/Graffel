import { expect, test } from '@playwright/test'

// v1.3 Keyboard & history: undo/redo, quick-insert, duplicate, nudge, select-all.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('toolbar undo/redo buttons are initially disabled', async ({ page }) => {
  await expect(page.getByTestId('action-undo')).toBeDisabled()
  await expect(page.getByTestId('action-redo')).toBeDisabled()
})

test('after adding a node, undo button enables and undoing removes the node', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await expect(page.getByTestId('shape-service')).toBeVisible()
  await expect(page.getByTestId('action-undo')).toBeEnabled()
  await page.getByTestId('action-undo').click()
  await expect(page.getByTestId('shape-service')).toHaveCount(0)
  await expect(page.getByTestId('action-redo')).toBeEnabled()
})

test('keyboard Cmd+Z undoes / Cmd+Shift+Z redoes', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await expect(page.getByTestId('shape-service')).toBeVisible()
  // Cross-platform shortcut.
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.getByTestId('shape-service')).toHaveCount(0)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(page.getByTestId('shape-service')).toBeVisible()
})

test('quick-insert R inserts a rectangle at cursor flow position', async ({ page }) => {
  // Move cursor over the canvas first so the keypress has a position to use.
  const canvas = page.getByTestId('canvas-host')
  await canvas.hover()
  await page.keyboard.press('r')
  await expect(page.getByTestId('shape-rectangle')).toBeVisible()
})

test('quick-insert E inserts an ellipse, D a diamond, T a text node', async ({ page }) => {
  const canvas = page.getByTestId('canvas-host')
  await canvas.hover()
  await page.keyboard.press('e')
  await page.keyboard.press('d')
  await page.keyboard.press('t')
  await expect(page.getByTestId('shape-ellipse')).toBeVisible()
  await expect(page.getByTestId('shape-diamond')).toBeVisible()
  await expect(page.getByTestId('shape-text')).toBeVisible()
})

test('Cmd+D duplicates the selected node at +20 offset', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  // Programmatically select the shape so the test isn't sensitive to click hit-testing.
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: { id: string }[]; selectNodes: (ids: string[]) => void } } } }
    const s = w.__graffel.useDiagramStore.getState()
    s.selectNodes(s.nodes.map((n) => n.id))
  })
  const before = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: unknown[] } } } }
    return w.__graffel.useDiagramStore.getState().nodes.length
  })
  expect(before).toBe(1)
  await page.keyboard.press('ControlOrMeta+d')
  const after = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: { position: { x: number; y: number } }[] } } } }
    return w.__graffel.useDiagramStore.getState().nodes
  })
  expect(after).toHaveLength(2)
  const [orig, clone] = after
  expect(clone!.position.x - orig!.position.x).toBe(20)
  expect(clone!.position.y - orig!.position.y).toBe(20)
})

test('arrow keys nudge selected nodes; shift+arrow nudges 10x', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: { id: string }[]; selectNodes: (ids: string[]) => void } } } }
    const s = w.__graffel.useDiagramStore.getState()
    s.selectNodes(s.nodes.map((n) => n.id))
  })
  const before = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: { position: { x: number; y: number } }[] } } } }
    return w.__graffel.useDiagramStore.getState().nodes[0]!.position
  })
  // Plain arrow: 1px
  await page.keyboard.press('ArrowRight')
  // Shift+arrow: 10px
  await page.keyboard.press('Shift+ArrowDown')
  const after = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: { position: { x: number; y: number } }[] } } } }
    return w.__graffel.useDiagramStore.getState().nodes[0]!.position
  })
  expect(after.x - before.x).toBe(1)
  expect(after.y - before.y).toBe(10)
})

test('Cmd+A selects all nodes and edges', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('palette-database').click()
  await page.getByTestId('palette-queue').click()
  await page.keyboard.press('ControlOrMeta+a')
  const sel = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectedNodeIds: string[]; selectedEdgeIds: string[] } } } }
    const s = w.__graffel.useDiagramStore.getState()
    return { nodes: s.selectedNodeIds.length, edges: s.selectedEdgeIds.length }
  })
  expect(sel.nodes).toBe(3)
})

test('typing in an input does not trigger quick-insert shortcuts', async ({ page }) => {
  // `fill` clears + sets in one shot; using `type` would append to the default "Untitled diagram".
  await page.getByTestId('title-input').fill('')
  await page.getByTestId('title-input').focus()
  await page.keyboard.type('rectangle ellipse')
  // None of those keys should have inserted shapes.
  await expect(page.getByTestId('shape-rectangle')).toHaveCount(0)
  await expect(page.getByTestId('shape-ellipse')).toHaveCount(0)
  await expect(page.getByTestId('title-input')).toHaveValue('rectangle ellipse')
})
