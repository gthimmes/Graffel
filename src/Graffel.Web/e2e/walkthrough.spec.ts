import { expect, test, type Page } from '@playwright/test'

// v3.23 — walkthrough (presenter) mode: author ordered stops (level + selection
// + note) and step through them full-screen. Tour persists with the document.

async function seed(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(() => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXTOURDOCXXXXXXXXXXXXXXX',
      metadata: { title: 'Platform', createdAt: '2026-06-25T00:00:00Z', updatedAt: '2026-06-25T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'web', type: 'basic:rectangle', parentId: null, position: { x: 60, y: 240 }, size: { w: 120, h: 70 }, data: { label: 'Web' } },
        { id: 'box', type: 'arch-core:boundary', parentId: null, position: { x: 320, y: 120 }, size: { w: 380, h: 280 }, data: { label: 'Cluster' } },
        { id: 'auth', type: 'arch-core:service', parentId: 'box', position: { x: 40, y: 60 }, size: { w: 120, h: 90 }, data: { label: 'Auth' } },
        { id: 'db', type: 'arch-core:database', parentId: 'box', position: { x: 210, y: 60 }, size: { w: 120, h: 90 }, data: { label: 'DB' } },
      ],
      edges: [],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
}

function selectInStore(page: Page, ids: string[]) {
  return page.evaluate((sel) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectNodes: (i: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectNodes(sel)
  }, ids)
}
function storeState(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { viewRootId: string | null; selectedNodeIds: string[]; tourStops: unknown[] } } } }
    const s = w.__graffel.useDiagramStore.getState()
    return { viewRootId: s.viewRootId, selectedNodeIds: s.selectedNodeIds, stopCount: s.tourStops.length }
  })
}

test('author two stops and present them, stepping between levels', async ({ page }) => {
  await seed(page)

  // Open the walkthrough panel.
  await page.getByTestId('action-tour').click()
  await expect(page.getByTestId('tour-panel')).toBeVisible()
  await expect(page.getByTestId('tour-empty')).toBeVisible()

  // Stop 1: root level, Web highlighted.
  await selectInStore(page, ['web'])
  await page.getByTestId('tour-add-stop').click()

  // Stop 2: drill into the Cluster, highlight Auth.
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(300)
  await selectInStore(page, ['auth'])
  await page.getByTestId('tour-add-stop').click()

  // Two stops authored.
  expect((await storeState(page)).stopCount).toBe(2)

  // Present.
  await page.getByTestId('tour-present').click()
  await expect(page.getByTestId('presenter')).toBeVisible()
  await expect(page.getByTestId('presenter-counter')).toHaveText('1 / 2')
  await page.waitForTimeout(200)
  {
    const s = await storeState(page)
    expect(s.viewRootId).toBeNull()
    expect(s.selectedNodeIds).toEqual(['web'])
  }

  // Advance to stop 2 → inside the Cluster, Auth selected.
  await page.getByTestId('presenter-next').click()
  await expect(page.getByTestId('presenter-counter')).toHaveText('2 / 2')
  await page.waitForTimeout(200)
  {
    const s = await storeState(page)
    expect(s.viewRootId).toBe('box')
    expect(s.selectedNodeIds).toEqual(['auth'])
  }
  // Breadcrumb confirms we're inside the level.
  await expect(page.getByTestId('breadcrumbs')).toContainText('Cluster')

  // Exit closes the presenter.
  await page.getByTestId('presenter-exit').click()
  await expect(page.getByTestId('presenter')).toHaveCount(0)
})

test('keyboard arrows drive the presenter', async ({ page }) => {
  await seed(page)
  await page.getByTestId('action-tour').click()
  await selectInStore(page, ['web'])
  await page.getByTestId('tour-add-stop').click()
  await selectInStore(page, ['box'])
  await page.getByTestId('tour-add-stop').click()
  await page.getByTestId('tour-present').click()

  await expect(page.getByTestId('presenter-counter')).toHaveText('1 / 2')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('presenter-counter')).toHaveText('2 / 2')
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByTestId('presenter-counter')).toHaveText('1 / 2')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('presenter')).toHaveCount(0)
})

test('a note shows during the walkthrough', async ({ page }) => {
  await seed(page)
  await page.getByTestId('action-tour').click()
  await selectInStore(page, ['web'])
  const stopId = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { addTourStop: () => string } } } }
    return w.__graffel.useDiagramStore.getState().addTourStop()
  })
  await page.getByTestId(`tour-stop-note-${stopId}`).fill('This is the entry point.')
  await page.getByTestId('tour-present').click()
  await expect(page.getByTestId('presenter-note')).toHaveText('This is the entry point.')
})

test('the tour persists across reload', async ({ page }) => {
  await seed(page)
  await page.getByTestId('action-tour').click()
  await selectInStore(page, ['web'])
  await page.getByTestId('tour-add-stop').click()
  await selectInStore(page, ['box'])
  await page.getByTestId('tour-add-stop').click()
  expect((await storeState(page)).stopCount).toBe(2)

  // Allow the debounced autosave to flush, then reload.
  await page.waitForTimeout(700)
  await page.reload()
  await page.waitForSelector('.react-flow__node')
  expect((await storeState(page)).stopCount).toBe(2)

  // Re-open the panel — both stops are listed and presentable.
  await page.getByTestId('action-tour').click()
  await expect(page.getByTestId('tour-present')).toBeEnabled()
})
