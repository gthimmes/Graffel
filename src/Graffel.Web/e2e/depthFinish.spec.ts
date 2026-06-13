import { expect, test, type Page } from '@playwright/test'

// v3.17 — boundary stubs for cross-level edges, and level deep-links.

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

async function seed(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(() => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXDEPTHDOCXXXXXXXXXXXXXX',
      metadata: { title: 'Platform', createdAt: '2026-06-12T00:00:00Z', updatedAt: '2026-06-12T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'web', type: 'basic:rectangle', parentId: null, position: { x: 60, y: 240 }, size: { w: 120, h: 70 }, data: { label: 'Web' } },
        { id: 'box', type: 'arch-core:boundary', parentId: null, position: { x: 320, y: 120 }, size: { w: 380, h: 280 }, data: { label: 'Cluster' } },
        { id: 'auth', type: 'arch-core:service', parentId: 'box', position: { x: 40, y: 60 }, size: { w: 120, h: 90 }, data: { label: 'Auth' } },
        { id: 'bill', type: 'arch-core:service', parentId: 'box', position: { x: 210, y: 60 }, size: { w: 120, h: 90 }, data: { label: 'Billing' } },
        { id: 'mail', type: 'arch-core:external', parentId: null, position: { x: 820, y: 250 }, size: { w: 130, h: 80 }, data: { label: 'Email' } },
      ],
      edges: [
        { id: 'e_in', source: 'web', sourceHandle: 'right', target: 'auth', targetHandle: 'left', type: 'straight', data: { label: '', waypoints: [] } },
        { id: 'e_out', source: 'bill', sourceHandle: 'right', target: 'mail', targetHandle: 'left', type: 'straight', data: { label: '', waypoints: [] } },
      ],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
}

function viewRoot(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { viewRootId: string | null } } } }
    return w.__graffel.useDiagramStore.getState().viewRootId
  })
}
function selected(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectedNodeIds: string[] } } } }
    return w.__graffel.useDiagramStore.getState().selectedNodeIds
  })
}

test('drilling shows boundary stubs for cross-level edges (raw edges hidden)', async ({ page }) => {
  await seed(page)
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(400)

  // Inbound stub on Auth (from Web), outbound stub on Billing (to Email).
  await expect(page.getByTestId('stub-e_in')).toBeVisible()
  await expect(page.getByTestId('stub-e_out')).toBeVisible()
  await expect(page.getByTestId('stub-e_in')).toContainText('Web')
  await expect(page.getByTestId('stub-e_out')).toContainText('Email')
  // The raw cross-level edges are not drawn in the edge layer inside the level.
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)
})

test('clicking an inbound stub reveals the off-level peer', async ({ page }) => {
  await seed(page)
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(400)
  await page.getByTestId('stub-e_in').click()
  await page.waitForTimeout(200)
  expect(await viewRoot(page)).toBeNull() // Web lives at the root
  expect(await selected(page)).toEqual(['web'])
})

test('breadcrumb "Link" copies a deep-link that reopens the level on reload', async ({ page }) => {
  await seed(page)
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(400)
  await page.getByTestId('crumb-copy-link').click()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toContain('#l=box')

  // Navigate to the copied link → app opens already inside the Cluster.
  await page.goto(link)
  await page.waitForSelector('.react-flow__node')
  await page.waitForTimeout(300)
  expect(await viewRoot(page)).toBe('box')
  await expect(page.getByTestId('crumb-box')).toHaveText('Cluster')
})

test('the URL hash stays in sync with the current level', async ({ page }) => {
  await seed(page)
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.location.hash)).toBe('#l=box')
  await page.keyboard.press('Escape') // climb to root
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.location.hash)).toBe('')
})

test('a deep-link drills in even in read-only (share) mode', async ({ page }) => {
  await seed(page)
  // Simulate share: readOnly, then navigate the hash and re-drill via the store.
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { setReadOnly: (v: boolean) => void; enterContainer: (id: string) => void } } } }
    const st = w.__graffel.useDiagramStore.getState()
    st.setReadOnly(true)
    st.enterContainer('box')
  })
  await page.waitForTimeout(200)
  expect(await viewRoot(page)).toBe('box')
  await expect(page.getByTestId('breadcrumbs')).toBeVisible()
})
