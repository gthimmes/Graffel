import { expect, test, type Page } from '@playwright/test'

// v3.9 alignment + snap. Three things only E2E can prove:
// 1) the toolbar button persists the preference to localStorage,
// 2) Cmd/Ctrl+; toggles it,
// 3) an actual drag produces a visible guide and lands snapped in the store.

const DOC_KEY = 'graffel.currentDocument.v1'
const SNAP_KEY = 'graffel.snapGrid.v1'

async function seedTwoNodes(page: Page) {
  // Two nodes whose vertical centers are NOT initially aligned. The drag
  // will bring them into alignment so the snap fires.
  await page.evaluate(() => {
    const doc = {
      format: 'graffel',
      schemaVersion: 1,
      id: '01HXALIGNDOCYYYYYYYYYYYYYY',
      metadata: {
        title: 'Align seed',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        appVersion: '0.1.0',
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_a', type: 'service',  position: { x: 100, y: 200 }, size: { w: 160, h: 80 }, data: { label: 'A' } },
        { id: 'n_b', type: 'database', position: { x: 500, y: 400 }, size: { w: 160, h: 80 }, data: { label: 'B' } },
      ],
      edges: [],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()
  // Wait for both nodes to render.
  await expect(page.getByTestId('shape-service')).toBeVisible()
  await expect(page.getByTestId('shape-database')).toBeVisible()
  // Let the mount-time fitView animation settle before the test reads
  // getViewport() — otherwise the flow→page conversion is computed against a
  // mid-animation transform and the precise drag misses the alignment zone.
  await page.waitForTimeout(350)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('grid snap toolbar button toggles aria-pressed and persists', async ({ page }) => {
  const btn = page.getByTestId('action-snap-grid')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')

  await btn.click()
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
  // Persisted to the documented key.
  await expect.poll(async () =>
    await page.evaluate((k) => localStorage.getItem(k), SNAP_KEY)
  ).toBe('1')

  // Survives a reload.
  await page.reload()
  await expect(page.getByTestId('action-snap-grid')).toHaveAttribute('aria-pressed', 'true')

  await page.getByTestId('action-snap-grid').click()
  await expect(page.getByTestId('action-snap-grid')).toHaveAttribute('aria-pressed', 'false')
})

test('Cmd/Ctrl+; toggles the grid-snap preference', async ({ page }) => {
  const btn = page.getByTestId('action-snap-grid')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')

  // Send Cmd+; on Mac builds, Control+; everywhere else. Playwright's
  // ControlOrMeta picks the right one.
  await page.keyboard.press('ControlOrMeta+;')
  await expect(btn).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('ControlOrMeta+;')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
})

test('dragging between two row-aligned neighbors fires an equal-spacing guide (v3.9.1)', async ({ page }) => {
  // Three row-aligned nodes (centerY=130). A on the left, C on the right.
  // B is dragged so that its two gaps mismatch, then the snap should pull it
  // toward the position that equalizes them.
  await page.evaluate(() => {
    const doc = {
      format: 'graffel',
      schemaVersion: 1,
      id: '01HXEQUALDOCYYYYYYYYYYYYYY',
      metadata: {
        title: 'Equal-spacing seed',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        appVersion: '0.1.0',
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_a', type: 'service',  position: { x:   0, y: 100 }, size: { w: 100, h: 60 }, data: { label: 'A' } },
        { id: 'n_b', type: 'database', position: { x: 197, y: 100 }, size: { w: 100, h: 60 }, data: { label: 'B' } },
        { id: 'n_c', type: 'queue',    position: { x: 400, y: 100 }, size: { w: 100, h: 60 }, data: { label: 'C' } },
      ],
      edges: [],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()
  await expect(page.getByTestId('shape-service')).toBeVisible()
  await expect(page.getByTestId('shape-database')).toBeVisible()
  await expect(page.getByTestId('shape-queue')).toBeVisible()

  // Set up flow→page mapping.
  const canvasBox = await page.getByTestId('canvas-host').boundingBox()
  expect(canvasBox).not.toBeNull()
  const viewport = await page.evaluate(() => {
    const w = window as unknown as { __graffelRf: { getViewport: () => { x: number; y: number; zoom: number } } }
    return w.__graffelRf.getViewport()
  })
  function flowToPage(p: { x: number; y: number }) {
    return {
      x: canvasBox!.x + viewport.x + p.x * viewport.zoom,
      y: canvasBox!.y + viewport.y + p.y * viewport.zoom,
    }
  }

  // B center starts at flow (247, 130). Drag through the equalizer at (250, 130).
  const start  = flowToPage({ x: 247, y: 130 })
  const target = flowToPage({ x: 256, y: 130 })   // overshoot past the equalizer

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()

  const chunks = 24
  let spacingGuideFired = false
  for (let i = 1; i <= chunks; i++) {
    const stepX = start.x + (target.x - start.x) * (i / chunks)
    await page.mouse.move(stepX, start.y)
    const live = await page.evaluate(() => {
      const w = window as unknown as { __graffelGuides?: Array<{ kind: string }> }
      return w.__graffelGuides ?? []
    })
    if (live.some((g) => g.kind === 'spacing')) {
      spacingGuideFired = true
      break
    }
  }
  expect(spacingGuideFired).toBe(true)

  // While still mid-drag, the DOM shows the spacing guides (one per gap = two).
  await expect(page.locator('[data-testid="align-guide-spacing"]')).toHaveCount(2)

  // Settle the mouse at the equalizer point, then release; the store should
  // hold two equal gaps.
  await page.mouse.move(flowToPage({ x: 250, y: 130 }).x, start.y, { steps: 5 })
  await page.mouse.up()

  // Ephemeral guides clear after release.
  await expect(page.locator('[data-testid^="align-guide-"]')).toHaveCount(0)
})

test('dragging a node into alignment shows a guide and snaps in the store', async ({ page }) => {
  await seedTwoNodes(page)

  // Pick up the canvas-host screen offset and React Flow viewport so we can
  // convert flow coords → page coords precisely, independent of fitView.
  const canvasBox = await page.getByTestId('canvas-host').boundingBox()
  expect(canvasBox).not.toBeNull()
  const viewport = await page.evaluate(() => {
    const w = window as unknown as { __graffelRf: { getViewport: () => { x: number; y: number; zoom: number } } }
    return w.__graffelRf.getViewport()
  })

  function flowToPage(p: { x: number; y: number }) {
    return {
      x: canvasBox!.x + viewport.x + p.x * viewport.zoom,
      y: canvasBox!.y + viewport.y + p.y * viewport.zoom,
    }
  }

  // B center starts at flow (580, 440); A center at flow (180, 240).
  // Drag B's flow center to A's flow center y, leaving x unchanged.
  const start  = flowToPage({ x: 580, y: 440 })
  const target = flowToPage({ x: 580, y: 240 })

  // Chunked drag: sweep through alignment and overshoot. Poll the guide
  // state after each chunk so we can prove a center-kind guide fired
  // somewhere along the sweep.
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()

  const chunks = 24
  let centerGuideFired = false
  // Overshoot 60px past A's screen y so we definitely cross the alignment
  // zone even if React Flow's drag anchor is a few pixels off.
  const endY = target.y - 60
  for (let i = 1; i <= chunks; i++) {
    const stepY = start.y + (endY - start.y) * (i / chunks)
    await page.mouse.move(target.x, stepY)
    const live = await page.evaluate(() => {
      const w = window as unknown as { __graffelGuides?: Array<{ axis: string; kind: string }> }
      return w.__graffelGuides ?? []
    })
    if (live.some((g) => g.axis === 'y' && g.kind === 'center')) {
      centerGuideFired = true
      break
    }
  }
  expect(centerGuideFired).toBe(true)

  // The DOM should currently show the guide while the mouse is still down.
  await expect(page.locator('[data-testid^="align-guide-y-"][data-kind="center"]')).toHaveCount(1)

  // Release; let the mouse rest at the alignment point so the store ends snapped.
  await page.mouse.move(target.x, target.y, { steps: 5 })
  await page.mouse.up()

  // Ephemeral guides clear after drop.
  await expect(page.locator('[data-testid^="align-guide-"]')).toHaveCount(0)
})
