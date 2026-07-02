import { expect, test, type Page } from '@playwright/test'

// v3.26 — version history + autosave trust. Snapshots you can restore, and a
// visible "saved" indicator so you know your work is persisted.

async function freshApp(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('[data-testid="toolbar"]')
}

function addNode(page: Page, label: string) {
  return page.evaluate((lbl) => {
    const w = window as unknown as {
      __graffel: { useDiagramStore: { getState: () => { addNode: (s: string, p: { x: number; y: number }) => string; updateNodeLabel?: (id: string, l: string) => void } } }
    }
    const s = w.__graffel.useDiagramStore.getState()
    const id = s.addNode('basic:rectangle', { x: 100 + Math.round(Math.random() * 50), y: 100 })
    return id + ':' + lbl
  }, label)
}

function nodeCount(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: unknown[] } } } }
    return w.__graffel.useDiagramStore.getState().nodes.length
  })
}

test('the save indicator shows Saved after an edit', async ({ page }) => {
  await freshApp(page)
  await addNode(page, 'A')
  await expect(page.getByTestId('save-status')).toContainText('Saved', { timeout: 5000 })
})

test('snapshot then restore reverts later edits', async ({ page }) => {
  await freshApp(page)
  await addNode(page, 'A')
  await expect.poll(() => nodeCount(page)).toBe(1)

  // Capture a named snapshot of the one-node state.
  await page.getByTestId('action-history').click()
  await expect(page.getByTestId('history-panel')).toBeVisible()
  await page.getByTestId('history-name-input').fill('one node')
  await page.getByTestId('history-snapshot').click()
  await expect(page.locator('[data-testid^="history-item-"]').first()).toContainText('one node')

  // Add a second node...
  await addNode(page, 'B')
  await expect.poll(() => nodeCount(page)).toBe(2)

  // ...then restore the snapshot → back to one node.
  await page.locator('[data-testid^="history-restore-"]').first().click()
  await expect(page.getByTestId('dialog-confirm')).toBeVisible()
  await page.getByTestId('dialog-ok').click()
  await expect.poll(() => nodeCount(page), { timeout: 5000 }).toBe(1)
})

test('deleting a version removes it from the list', async ({ page }) => {
  await freshApp(page)
  await addNode(page, 'A')
  await page.getByTestId('action-history').click()
  await page.getByTestId('history-name-input').fill('keep me')
  await page.getByTestId('history-snapshot').click()

  const item = page.locator('[data-testid^="history-item-"]').first()
  await expect(item).toBeVisible()
  const before = await page.locator('[data-testid^="history-item-"]').count()

  await page.locator('[data-testid^="history-delete-"]').first().click()
  await expect.poll(async () => page.locator('[data-testid^="history-item-"]').count()).toBe(before - 1)
})
