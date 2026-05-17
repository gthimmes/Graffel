import { expect, test } from '@playwright/test'

// v1.1 Inspector: right-side property panel, selection-driven.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('inspector shows empty state when nothing is selected', async ({ page }) => {
  await expect(page.getByTestId('inspector')).toBeVisible()
  await expect(page.getByTestId('inspector-empty')).toBeVisible()
})

test('selecting a node shows the node inspector', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await expect(page.getByTestId('node-inspector')).toBeVisible()
  // The label field exists and reflects current value.
  await expect(page.getByTestId('ni-label')).toHaveValue('Service')
})

test('renaming via inspector updates the shape on canvas', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await page.getByTestId('ni-label').fill('Auth API')
  // Click the canvas host to commit (blur the input via clicking elsewhere is unnecessary —
  // React updates on each onChange).
  await expect(page.getByTestId('shape-service')).toContainText('Auth API')
})

test('changing font size from inspector updates the canvas style', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await page.getByTestId('ni-font-size').fill('20')
  // Wait for the style application — React Flow rerenders synchronously.
  const shape = page.getByTestId('shape-service')
  await expect(shape).toHaveCSS('font-size', '20px')
})

test('font weight toggles are reflected in computed style', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await page.getByTestId('ni-font-weight-bold').click()
  const shape = page.getByTestId('shape-service')
  await expect(shape).toHaveCSS('font-weight', '700')
})

test('changing width and height via inspector resizes the node', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await page.getByTestId('ni-width').fill('260')
  await page.getByTestId('ni-height').fill('140')
  // Logical size (not zoomed bounding box): the inner shape's CSS width is the source of truth.
  const shape = page.getByTestId('shape-service')
  await expect(shape).toHaveCSS('width', '260px')
  await expect(shape).toHaveCSS('height', '140px')
  // And the persisted document carries the new size.
  await page.waitForTimeout(700)
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('graffel.currentDocument.v1')!
    return JSON.parse(raw).nodes[0].size
  })
  expect(stored).toEqual({ w: 260, h: 140 })
})

test('inspector style changes persist across reload', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('shape-service').click()
  await page.getByTestId('ni-font-size').fill('22')
  await page.getByTestId('ni-font-weight-bold').click()
  await page.waitForTimeout(700)
  await page.reload()
  // Re-select to show inspector and confirm the values are restored.
  await page.getByTestId('shape-service').click()
  await expect(page.getByTestId('ni-font-size')).toHaveValue('22')
  await expect(page.getByTestId('shape-service')).toHaveCSS('font-size', '22px')
  await expect(page.getByTestId('shape-service')).toHaveCSS('font-weight', '700')
})

test('edge selection: switching connector type updates the document', async ({ page }) => {
  // Seed a diagram with two nodes + one orthogonal edge directly via localStorage.
  await page.evaluate(() => {
    const doc = {
      format: 'graffel',
      schemaVersion: 1,
      id: '01HXSEEDDOCXXXXXXXXXXXXXXX',
      metadata: {
        title: 'Seeded',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        appVersion: '0.1.0',
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_a', type: 'service',  position: { x: 100, y: 100 }, size: { w: 160, h: 80 }, data: { label: 'A' } },
        { id: 'n_b', type: 'database', position: { x: 400, y: 100 }, size: { w: 120, h: 90 }, data: { label: 'B' } },
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

  // Click the edge — React Flow renders it as a path inside .react-flow__edges.
  const edgePath = page.locator('.react-flow__edge').first()
  await expect(edgePath).toBeVisible()
  await edgePath.click()

  await expect(page.getByTestId('edge-inspector')).toBeVisible()
  // Switch to curved.
  await page.getByTestId('ei-type-bezier').click()

  // The document in localStorage should now reflect the new type (after autosave).
  await page.waitForTimeout(700)
  const storedType = await page.evaluate(() => {
    const raw = localStorage.getItem('graffel.currentDocument.v1')!
    const doc = JSON.parse(raw)
    return doc.edges[0].type
  })
  expect(storedType).toBe('bezier')
})
