import { expect, test } from '@playwright/test'

// v1.2 Connector waypoints: drag a midpoint to add a corner; move corners; clear them.

const SEED_DOC_KEY = 'graffel.currentDocument.v1'

async function seedDiagramWithEdge(page: import('@playwright/test').Page) {
  // Place two nodes and one orthogonal edge programmatically so tests can focus on waypoints.
  await page.evaluate(() => {
    const doc = {
      format: 'graffel',
      schemaVersion: 1,
      id: '01HXWPSEEDDOCYYYYYYYYYYYYYY',
      metadata: {
        title: 'Waypoint seed',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        appVersion: '0.1.0',
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_a', type: 'service',  position: { x: 100, y: 200 }, size: { w: 160, h: 80 }, data: { label: 'A' } },
        { id: 'n_b', type: 'database', position: { x: 600, y: 200 }, size: { w: 120, h: 90 }, data: { label: 'B' } },
      ],
      edges: [
        {
          id: 'e_1',
          source: 'n_a',
          sourceHandle: 'right',
          target: 'n_b',
          targetHandle: 'left',
          type: 'orthogonal',
          data: { label: '' },
        },
      ],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
  // Let the mount-time fitView animation settle before tests compute drag
  // coordinates from rendered geometry.
  await page.waitForTimeout(350)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('selecting an edge with no waypoints shows "no corners" hint', async ({ page }) => {
  await seedDiagramWithEdge(page)
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })
  await expect(page.getByTestId('edge-inspector')).toBeVisible()
  await expect(page.getByTestId('ei-waypoint-count')).toContainText('No corners')
})

test('dragging a midpoint handle inserts a waypoint that persists', async ({ page }) => {
  await seedDiagramWithEdge(page)
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })

  // The midpoint ghost handle for the only segment of e_1 (segmentIndex 0).
  const ghost = page.getByTestId('waypoint-handle-e_1-ghost-0')
  await expect(ghost).toBeAttached()

  // Drag it ~150px down from its current midpoint position.
  const ghostBox = await ghost.boundingBox()
  expect(ghostBox).not.toBeNull()
  await page.mouse.move(ghostBox!.x + ghostBox!.width / 2, ghostBox!.y + ghostBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(ghostBox!.x + ghostBox!.width / 2, ghostBox!.y + ghostBox!.height / 2 + 150, { steps: 10 })
  await page.mouse.up()

  // Wait for autosave debounce, then verify the waypoint is in the persisted doc.
  await page.waitForTimeout(700)
  const wp = await page.evaluate(() => {
    const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
    return doc.edges[0].data.waypoints
  })
  expect(wp).toHaveLength(1)
  // Waypoints are 8px-snapped flow coordinates; just sanity-check that one was added.
  expect(wp[0].x).toBeGreaterThan(0)
  expect(wp[0].y).toBeGreaterThan(0)

  // Inspector now reports 1 corner.
  await expect(page.getByTestId('ei-waypoint-count')).toContainText('1 corner')
})

test('inspector "Clear" button removes all waypoints', async ({ page }) => {
  // Pre-seed with a waypoint already in place.
  await page.evaluate(() => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXCLEARDOCXXXXXXXXXXXXXXX',
      metadata: { title: 'Clear seed', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', appVersion: '0.1.0' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_a', type: 'service',  position: { x: 100, y: 200 }, size: { w: 160, h: 80 }, data: { label: 'A' } },
        { id: 'n_b', type: 'database', position: { x: 600, y: 200 }, size: { w: 120, h: 90 }, data: { label: 'B' } },
      ],
      edges: [
        {
          id: 'e_1', source: 'n_a', sourceHandle: 'right', target: 'n_b', targetHandle: 'left',
          type: 'orthogonal',
          data: { label: '', waypoints: [{ x: 350, y: 320 }, { x: 500, y: 320 }] },
        },
      ],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()

  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })
  await expect(page.getByTestId('ei-waypoint-count')).toContainText('2 corners')
  await page.getByTestId('ei-clear-corners').click()
  await expect(page.getByTestId('ei-waypoint-count')).toContainText('No corners')

  await page.waitForTimeout(700)
  const wp = await page.evaluate(() => {
    const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
    return doc.edges[0].data.waypoints
  })
  expect(wp).toEqual([])
})

test('right-clicking a real waypoint handle removes it', async ({ page }) => {
  await page.evaluate(() => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXRMVDOCXXXXXXXXXXXXXXXXX',
      metadata: { title: 'Remove seed', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', appVersion: '0.1.0' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_a', type: 'service',  position: { x: 100, y: 200 }, size: { w: 160, h: 80 }, data: { label: 'A' } },
        { id: 'n_b', type: 'database', position: { x: 600, y: 200 }, size: { w: 120, h: 90 }, data: { label: 'B' } },
      ],
      edges: [
        {
          id: 'e_1', source: 'n_a', sourceHandle: 'right', target: 'n_b', targetHandle: 'left',
          type: 'orthogonal',
          data: { label: '', waypoints: [{ x: 350, y: 320 }] },
        },
      ],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()

  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })
  const real = page.getByTestId('waypoint-handle-e_1-real-0')
  await expect(real).toBeAttached()
  await real.click({ button: 'right' })
  await page.waitForTimeout(700)
  const wp = await page.evaluate(() => {
    const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
    return doc.edges[0].data.waypoints
  })
  expect(wp).toEqual([])
})
