import { expect, test, type Page } from '@playwright/test'

// v3.14 — drill-down containers: double-click enters a container's interior
// (breadcrumb navigates back), collapse hides contents with edges re-targeted
// to the container, and navigation works in read-only share views.

async function seed(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(() => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXDRILLDOCXXXXXXXXXXXXXX',
      metadata: { title: 'Platform', createdAt: '2026-06-11T00:00:00Z', updatedAt: '2026-06-11T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'web', type: 'basic:rectangle', parentId: null, position: { x: 60, y: 220 }, size: { w: 120, h: 70 }, data: { label: 'Web' } },
        { id: 'box', type: 'arch-core:boundary', parentId: null, position: { x: 300, y: 120 }, size: { w: 360, h: 260 }, data: { label: 'Cluster' } },
        { id: 'auth', type: 'arch-core:service', parentId: 'box', position: { x: 40, y: 60 }, size: { w: 120, h: 90 }, data: { label: 'Auth' } },
        { id: 'db', type: 'arch-core:database', parentId: 'box', position: { x: 200, y: 60 }, size: { w: 110, h: 90 }, data: { label: 'DB' } },
      ],
      edges: [
        { id: 'e1', source: 'web', sourceHandle: 'right', target: 'auth', targetHandle: 'left', type: 'straight', data: { label: '', waypoints: [] } },
      ],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
}

function store(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => unknown } } }
    const s = w.__graffel.useDiagramStore.getState() as {
      nodes: Array<{ id: string; type: string; parentId: string | null }>
      viewRootId: string | null
    }
    return { nodeIds: s.nodes.map((n) => ({ id: n.id, parentId: n.parentId ?? null, type: n.type })), viewRootId: s.viewRootId }
  })
}

test('double-click enters a container: scoped view + breadcrumb; Esc exits', async ({ page }) => {
  await seed(page)
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(400) // fitView settle

  // Only the container's children render; outside nodes (and the container) don't.
  await expect(page.locator('.react-flow__node[data-id="auth"]')).toBeVisible()
  await expect(page.locator('.react-flow__node[data-id="db"]')).toBeVisible()
  await expect(page.locator('.react-flow__node[data-id="web"]')).toHaveCount(0)
  await expect(page.locator('.react-flow__node[data-id="box"]')).toHaveCount(0)
  // The cross-level edge is not rendered inside.
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)

  // Breadcrumb shows the level and navigates home.
  await expect(page.getByTestId('breadcrumbs')).toBeVisible()
  await expect(page.getByTestId('crumb-box')).toHaveText('Cluster')

  // Esc (nothing selected) climbs back to the root.
  await page.keyboard.press('Escape')
  expect((await store(page)).viewRootId).toBeNull()
  await expect(page.locator('.react-flow__node[data-id="web"]')).toBeVisible()
  await expect(page.getByTestId('breadcrumbs')).toHaveCount(0)
})

test('shapes added while drilled in are parented to the level', async ({ page }) => {
  await seed(page)
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(400)
  await page.getByTestId('palette-service').click()
  const s = await store(page)
  const added = s.nodeIds.find((n) => !['web', 'box', 'auth', 'db'].includes(n.id))
  expect(added).toBeTruthy()
  expect(added!.parentId).toBe('box')
})

test('collapse hides contents, re-targets edges to the container, badge shows count', async ({ page }) => {
  await seed(page)
  await page.locator('.react-flow__node[data-id="box"]').click({ button: 'right' })
  await expect(page.getByTestId('node-context-menu')).toBeVisible()
  await page.getByTestId('node-ctx-collapse').click()

  // Children hidden; web→auth edge still renders (re-targeted to the container).
  await expect(page.locator('.react-flow__node[data-id="auth"]')).toHaveCount(0)
  await expect(page.locator('.react-flow__edge[data-id="e1"]')).toBeVisible()
  await expect(page.getByTestId('collapse-badge')).toHaveText('▸ 2')

  // Expand restores the children.
  await page.locator('.react-flow__node[data-id="box"]').click({ button: 'right' })
  await page.getByTestId('node-ctx-collapse').click()
  await expect(page.locator('.react-flow__node[data-id="auth"]')).toBeVisible()
})

test('read-only share view can still drill in and navigate back', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { setReadOnly: (v: boolean) => void } } } }
    w.__graffel.useDiagramStore.getState().setReadOnly(true)
  })
  await page.locator('.react-flow__node[data-id="box"]').dblclick()
  await page.waitForTimeout(400)
  expect((await store(page)).viewRootId).toBe('box')
  await expect(page.getByTestId('breadcrumbs')).toBeVisible()
  await page.getByTestId('crumb-root').click()
  expect((await store(page)).viewRootId).toBeNull()
})
