import { expect, test } from '@playwright/test'

// v3.8: line styles + endpoint markers + anchor-to-silhouette.

async function seedEdge(page: import('@playwright/test').Page, style: Record<string, unknown> = {}) {
  await page.evaluate((edgeStyle) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXSTYLESEEDOCXXXXXXXXXXX',
      metadata: { title: 'styling', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', appVersion: '0.1.0' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_a', type: 'arch-core:service',  position: { x: 80,  y: 200 }, size: { w: 160, h: 110 }, data: { label: 'A' } },
        { id: 'n_b', type: 'arch-core:database', position: { x: 540, y: 200 }, size: { w: 120, h: 130 }, data: { label: 'B' } },
      ],
      edges: [
        {
          id: 'e_1', source: 'n_a', sourceHandle: 'right', target: 'n_b', targetHandle: 'left',
          type: 'straight',
          data: { label: '', waypoints: [], style: edgeStyle },
        },
      ],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  }, style)
  await page.reload()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('inspector shows line-style + endpoint controls when an edge is selected', async ({ page }) => {
  await seedEdge(page)
  // Select the edge via the store helper so we don't fight pane interception.
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })
  await expect(page.getByTestId('edge-inspector')).toBeVisible()
  await expect(page.getByTestId('ei-stroke-style')).toBeVisible()
  await expect(page.getByTestId('ei-marker-start')).toBeVisible()
  await expect(page.getByTestId('ei-marker-end')).toBeVisible()
  await expect(page.getByTestId('ei-marker-size')).toBeVisible()
})

test('changing stroke style to dashed updates the document', async ({ page }) => {
  await seedEdge(page)
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })
  await page.getByTestId('ei-stroke-style-dashed').click()
  await page.waitForTimeout(700)
  const stored = await page.evaluate(() => {
    const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
    return doc.edges[0].data.style?.strokeStyle
  })
  expect(stored).toBe('dashed')
})

test('selecting an end marker writes it to the edge style', async ({ page }) => {
  await seedEdge(page)
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })
  await page.getByTestId('ei-marker-end').selectOption('arrow')
  await page.waitForTimeout(700)
  const stored = await page.evaluate(() => {
    const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
    return doc.edges[0].data.style?.markerEnd
  })
  expect(stored).toBe('arrow')
})

test('marker size segmented control updates the edge', async ({ page }) => {
  await seedEdge(page, { markerEnd: 'arrow' })
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(['e_1'])
  })
  await page.getByTestId('ei-marker-size-lg').click()
  await page.waitForTimeout(700)
  const stored = await page.evaluate(() => {
    const doc = (window as unknown as { __graffel: { useDiagramStore: { getState: () => { toDocument: () => { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> } } } } }).__graffel.useDiagramStore.getState().toDocument()
    return doc.edges[0].data.style?.markerSize
  })
  expect(stored).toBe('lg')
})

test('marker start + end actually resolve to real marker defs on the rendered edge', async ({ page }) => {
  // Regression: the edge path must reference markers via url('#<id>') where the
  // id exists in <defs>. A double-wrapped url, or a markerStart that never
  // reaches BaseEdge, leaves the arrow invisible even though the store is correct.
  await seedEdge(page, { strokeColor: '#dc2626', markerStart: 'circle-filled', markerEnd: 'arrow', markerSize: 'lg' })
  await page.waitForSelector('.react-flow__edge[data-id="e_1"] .react-flow__edge-path')
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => {
    const path = document.querySelector('.react-flow__edge[data-id="e_1"] .react-flow__edge-path') as SVGPathElement | null
    const idFrom = (attr: string | null | undefined) => attr?.match(/url\(['"]?#([^'")]+)/)?.[1] ?? null
    const endId = idFrom(path?.getAttribute('marker-end'))
    const startId = idFrom(path?.getAttribute('marker-start'))
    return {
      endId, startId,
      endResolves: !!(endId && document.getElementById(endId)),
      startResolves: !!(startId && document.getElementById(startId)),
    }
  })
  expect(r.endId).toBe('graffel-arrow-lg-end')
  expect(r.endResolves).toBe(true)
  expect(r.startId).toBe('graffel-circle-filled-lg-start')
  expect(r.startResolves).toBe(true)
})

test('marker definitions are rendered in the DOM', async ({ page }) => {
  await page.goto('/')
  // The defs SVG ships every marker × size × role combo.
  const count = await page.evaluate(() =>
    document.querySelectorAll('marker[id^="graffel-"]').length
  )
  // 8 markers × 3 sizes × 2 roles = 48
  expect(count).toBe(48)
})

test('arch-core:database renders with handle positions inset from the bbox', async ({ page }) => {
  await page.getByTestId('palette-database').click()
  // Programmatically select so the resize controls + handles render.
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: { id: string }[]; selectNodes: (ids: string[]) => void } } } }
    const s = w.__graffel.useDiagramStore.getState()
    s.selectNodes([s.nodes[0]!.id])
  })
  // The top handle's rendered center should be inset from the node's top edge
  // (the cylinder top is ~9% down), not at y:0. Measure the real rendered center
  // as a fraction of the node box (zoom-independent). Comprehensive per-shape
  // coverage lives in anchorTouch.spec.ts.
  const topFrac = await page.evaluate(() => {
    const shape = document.querySelector('[data-testid="shape-database"]') as HTMLElement
    const hr = shape.getBoundingClientRect()
    const handle = shape.querySelector('.react-flow__handle-top') as HTMLElement | null
    if (!handle) return null
    const r = handle.getBoundingClientRect()
    return (((r.top + r.height / 2) - hr.top) / hr.height) * 100
  })
  expect(topFrac).not.toBeNull()
  // Clearly inset from the top edge, not floating above it.
  expect(topFrac!).toBeGreaterThan(2)
  expect(topFrac!).toBeLessThan(25)
})
