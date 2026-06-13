import { expect, test } from '@playwright/test'

// v3.0 Shape library + connector context menu.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    // Reset library prefs to defaults so disabled-pack tests aren't sticky.
    localStorage.removeItem('graffel.libraryPrefs.v1')
  })
  await page.reload()
})

test('palette shows a search input and visual previews', async ({ page }) => {
  await expect(page.getByTestId('palette-search')).toBeVisible()
  // Basic + Arch Core sections render visible previews by id.
  await expect(page.getByTestId('palette-rectangle')).toBeVisible()
  await expect(page.getByTestId('palette-service')).toBeVisible()
  // Previews are SVG-rendered, not the old text+swatch.
  const rectButton = page.getByTestId('palette-rectangle')
  await expect(rectButton.locator('svg')).toHaveCount(1)
})

test('search filters across packs', async ({ page }) => {
  await page.getByTestId('palette-search').fill('cache')
  // The cache shape is in arch-core; appears in results.
  await expect(page.getByTestId('palette-shape-arch-core-cache')).toBeVisible()
  // A non-cache shape (rectangle) should NOT appear in the search results section.
  await expect(page.getByTestId('palette-rectangle')).toHaveCount(0)
})

test('collapsing a section hides its shapes', async ({ page }) => {
  await expect(page.getByTestId('palette-service')).toBeVisible()
  await page.getByTestId('palette-section-toggle-arch-core').click()
  await expect(page.getByTestId('palette-service')).toHaveCount(0)
})

test('Library Manager toggles whether a pack appears', async ({ page }) => {
  await page.getByTestId('palette-manage-libraries').click()
  await expect(page.getByTestId('library-manager')).toBeVisible()
  // Disable the arch-core pack.
  await page.getByTestId('library-toggle-arch-core').click()
  // Close the modal.
  await page.getByTestId('library-manager-close').click()
  await expect(page.getByTestId('library-manager')).toHaveCount(0)
  // Arch core shapes are now gone from the palette; Basic still there.
  await expect(page.getByTestId('palette-service')).toHaveCount(0)
  await expect(page.getByTestId('palette-rectangle')).toBeVisible()
})

test('library preferences persist across reload', async ({ page }) => {
  await page.getByTestId('palette-manage-libraries').click()
  await page.getByTestId('library-toggle-arch-core').click()
  await page.getByTestId('library-manager-close').click()
  await expect(page.getByTestId('palette-service')).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('palette-service')).toHaveCount(0)
})

test('clicking a palette shape adds the right node id to the store', async ({ page }) => {
  await page.getByTestId('palette-shape-arch-core-server').click()
  const nodeType = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: { type: string }[] } } } }
    return w.__graffel.useDiagramStore.getState().nodes[0]?.type
  })
  expect(nodeType).toBe('arch-core:server')
})

test.describe('connector context menu', () => {
  async function rightClickEdge(page: import('@playwright/test').Page, edgeId = 'e_1') {
    // Wait for the edge to actually render before dispatching the contextmenu event.
    await expect(page.getByTestId(`edge-hitbox-${edgeId}`)).toBeAttached()
    await page.evaluate((id) => {
      const path = document.querySelector(`[data-testid="edge-hitbox-${id}"]`) as SVGPathElement | null
      if (!path) throw new Error(`hitbox not found for ${id}`)
      const rect = path.getBoundingClientRect()
      const ev = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 2,
      })
      path.dispatchEvent(ev)
    }, edgeId)
  }

  async function seedEdge(page: import('@playwright/test').Page, waypoints: { x: number; y: number }[] = []) {
    await page.evaluate((wp) => {
      const doc = {
        format: 'graffel',
        schemaVersion: 1,
        id: '01HXSHAPESEEDOCXXXXXXXXXXX',
        metadata: { title: 'ctx', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', appVersion: '0.1.0' },
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [
          { id: 'n_a', type: 'arch-core:service',  position: { x: 80, y: 200 }, size: { w: 160, h: 110 }, data: { label: 'A' } },
          { id: 'n_b', type: 'arch-core:database', position: { x: 540, y: 200 }, size: { w: 120, h: 130 }, data: { label: 'B' } },
        ],
        edges: [
          {
            id: 'e_1',
            source: 'n_a', sourceHandle: 'right',
            target: 'n_b', targetHandle: 'left',
            type: 'straight',
            data: { label: '', waypoints: wp },
          },
        ],
        reserved: { remote: null, ops: null },
      }
      localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
    }, waypoints)
    await page.reload()
  }

  test('right-click on an edge opens the context menu', async ({ page }) => {
    await seedEdge(page)
    await rightClickEdge(page)
    await expect(page.getByTestId('edge-context-menu')).toBeVisible()
    await expect(page.getByTestId('edge-ctx-orthogonal')).toBeVisible()
    await expect(page.getByTestId('edge-ctx-straight')).toBeVisible()
    await expect(page.getByTestId('edge-ctx-curved')).toBeVisible()
    await expect(page.getByTestId('edge-ctx-clear')).toBeVisible()
  })

  test('Make right-angle clears waypoints and sets edge.type to orthogonal', async ({ page }) => {
    await seedEdge(page, [{ x: 300, y: 320 }, { x: 460, y: 320 }])
    await rightClickEdge(page)
    await expect(page.getByTestId('edge-context-menu')).toBeVisible()
    await page.getByTestId('edge-ctx-orthogonal').click()
    await page.waitForTimeout(700)
    const result = await page.evaluate(() => {
      const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
      return { type: doc.edges[0].type, waypoints: doc.edges[0].data.waypoints }
    })
    expect(result.type).toBe('orthogonal')
    expect(result.waypoints).toEqual([])
  })

  test('Make curved sets edge.type to bezier and clears corners', async ({ page }) => {
    await seedEdge(page, [{ x: 300, y: 320 }])
    await rightClickEdge(page)
    await expect(page.getByTestId('edge-context-menu')).toBeVisible()
    await page.getByTestId('edge-ctx-curved').click()
    await page.waitForTimeout(700)
    const result = await page.evaluate(() => {
      const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
      return { type: doc.edges[0].type, waypoints: doc.edges[0].data.waypoints }
    })
    expect(result.type).toBe('bezier')
    expect(result.waypoints).toEqual([])
  })

  test('Clear corners keeps the current type, only wipes waypoints', async ({ page }) => {
    await seedEdge(page, [{ x: 300, y: 320 }])
    await rightClickEdge(page)
    await expect(page.getByTestId('edge-context-menu')).toBeVisible()
    await page.getByTestId('edge-ctx-clear').click()
    await page.waitForTimeout(700)
    const result = await page.evaluate(() => {
      const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
      return { type: doc.edges[0].type, waypoints: doc.edges[0].data.waypoints }
    })
    expect(result.type).toBe('straight')  // unchanged
    expect(result.waypoints).toEqual([])
  })
})
