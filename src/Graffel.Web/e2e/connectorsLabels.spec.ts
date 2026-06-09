import { expect, test } from '@playwright/test'

// v3.10 — silhouette-correct connection anchors + positioned/empty labels with
// type-to-edit. Covers the user-facing behaviors; the anchor geometry itself is
// unit-tested in src/canvas/anchors.test.ts.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('a connector label renders on the canvas and edits on double-click', async ({ page }) => {
  // Regression: WaypointEdge previously rendered no label at all, so connector
  // labels were stored/inspector-only and invisible on the canvas.
  await page.evaluate(() => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXEDGELABELDOCXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-08T00:00:00Z', updatedAt: '2026-06-08T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n1', type: 'basic:rectangle', position: { x: 80, y: 200 }, size: { w: 140, h: 80 }, data: { label: '' } },
        { id: 'n2', type: 'basic:rectangle', position: { x: 420, y: 200 }, size: { w: 140, h: 80 }, data: { label: '' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', sourceHandle: 'right', target: 'n2', targetHandle: 'left', type: 'straight', data: { label: 'reads', waypoints: [] } },
      ],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  })
  await page.reload()
  const lbl = page.getByTestId('edge-label-e1')
  await expect(lbl).toBeVisible()
  await expect(lbl).toHaveText('reads')
  // Double-click to edit inline.
  await lbl.dblclick()
  const input = page.getByTestId('edge-label-input-e1')
  await expect(input).toBeVisible()
  await input.fill('writes')
  await input.press('Enter')
  await expect(page.getByTestId('edge-label-e1')).toHaveText('writes')
})

test('new pictogram shapes start unlabeled with the label above the icon', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  const host = page.getByTestId('shape-label-host')
  await expect(host).toHaveAttribute('data-label-pos', 'top')
  // No label text until the user types one.
  await expect(page.getByTestId('shape-label')).toHaveCount(0)
})

test('typing on a selected shape edits its label (replacing the text)', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  // A printable keystroke opens the inline editor seeded with that character.
  await page.keyboard.press('A')
  const input = page.getByTestId('shape-label-input')
  await expect(input).toBeVisible()
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('A')
  await input.pressSequentially('uth')
  await input.press('Enter')
  await expect(page.getByTestId('shape-service')).toContainText('Auth')
})

test('a selected shape does NOT trigger quick-insert (no stray rectangle)', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await page.keyboard.press('r') // would quick-insert a rectangle if not for type-to-edit
  await expect(page.getByTestId('shape-rectangle')).toHaveCount(0)
  // ...and it opened the editor instead.
  await expect(page.getByTestId('shape-label-input')).toBeVisible()
})

test('inspector can move the label below the shape', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await page.getByTestId('ni-label-position').selectOption('bottom')
  await expect(page.getByTestId('shape-label-host')).toHaveAttribute('data-label-pos', 'bottom')
})

test('connection anchors are inset onto the silhouette for letterboxed icons', async ({ page }) => {
  // Service is a "contain" pictogram in a non-square box, so its right anchor
  // must sit well inside the bounding box (not floating off the right edge).
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  // Measure the right handle's real rendered center as a fraction of the node
  // box (zoom-independent). Per-shape exhaustive coverage is in anchorTouch.spec.
  const rightFrac = await page.evaluate(() => {
    const hostEl = document.querySelector('[data-testid="shape-service"]') as HTMLElement | null
    if (!hostEl) return null
    const hr = hostEl.getBoundingClientRect()
    const right = hostEl.querySelector('.react-flow__handle-right') as HTMLElement | null
    if (!right) return null
    const r = right.getBoundingClientRect()
    return (((r.left + r.width / 2) - hr.left) / hr.width) * 100
  })
  expect(rightFrac).not.toBeNull()
  // Default (no correction) would put it at the box edge (~100%); the letterbox
  // correction + attachment inset pull it inward.
  expect(rightFrac!).toBeGreaterThan(55)
  expect(rightFrac!).toBeLessThan(95)
})
