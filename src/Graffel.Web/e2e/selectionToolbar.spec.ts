import { expect, test, type Page } from '@playwright/test'

// v3.12 — on-canvas selection toolbar: quick fill/border/text + group/ungroup for
// nodes, stroke/line/arrows for edges. The full Inspector remains the complete
// editor; this covers the floating-bar behaviors.

interface SeedNode { id: string; type: string; x: number; y: number; w?: number; h?: number }
interface SeedEdge { id: string; source: string; target: string }

async function seed(page: Page, nodes: SeedNode[], edges: SeedEdge[] = []) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(({ ns, es }) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXTOOLBARDOCXXXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-10T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: (ns as SeedNode[]).map((n) => ({
        id: n.id, type: n.type, parentId: null,
        position: { x: n.x, y: n.y }, size: { w: n.w ?? 150, h: n.h ?? 100 },
        data: { label: '' },
      })),
      edges: (es as SeedEdge[]).map((e) => ({
        id: e.id, source: e.source, target: e.target,
        sourceHandle: 'right', targetHandle: 'left', type: 'straight',
        data: { label: '', waypoints: [] },
      })),
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  }, { ns: nodes, es: edges })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
}

function nodeStyle(page: Page, id: string) {
  return page.evaluate((nid) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ id: string; type: string; data: { style?: Record<string, unknown> } }> } } } }
    const n = w.__graffel.useDiagramStore.getState().nodes.find((x) => x.id === nid)
    return { type: n?.type, style: (n?.data.style ?? {}) as Record<string, unknown> }
  }, id)
}

function edgeStyle(page: Page, id: string) {
  return page.evaluate((eid) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { edges: Array<{ id: string; data: { style?: Record<string, unknown> } }> } } } }
    const e = w.__graffel.useDiagramStore.getState().edges.find((x) => x.id === eid)
    return (e?.data.style ?? {}) as Record<string, unknown>
  }, id)
}

function groupCount(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ type: string }> } } } }
    return w.__graffel.useDiagramStore.getState().nodes.filter((n) => n.type === 'basic:group').length
  })
}

async function selectNodes(page: Page, ids: string[]) {
  await page.evaluate((sel) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectNodes: (i: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectNodes(sel)
  }, ids)
}
async function selectEdges(page: Page, ids: string[]) {
  await page.evaluate((sel) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectEdges: (i: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectEdges(sel)
  }, ids)
}

test('node selection shows the toolbar; Fill popover applies a color', async ({ page }) => {
  await seed(page, [{ id: 'n1', type: 'arch-core:service', x: 300, y: 240 }])
  await selectNodes(page, ['n1'])
  await expect(page.getByTestId('selection-toolbar')).toBeVisible()

  await page.getByTestId('stb-fill').click()
  await expect(page.getByTestId('stb-fill-pop')).toBeVisible()
  await page.getByTestId('stb-fill-pop').getByRole('button', { name: 'Color #2563eb' }).click()
  expect((await nodeStyle(page, 'n1')).style.fill).toBe('#2563eb')
})

test('Group button appears for a multi-selection and creates a container', async ({ page }) => {
  await seed(page, [
    { id: 'n1', type: 'basic:rectangle', x: 120, y: 240 },
    { id: 'n2', type: 'basic:rectangle', x: 360, y: 240 },
  ])
  await selectNodes(page, ['n1', 'n2'])
  await expect(page.getByTestId('stb-group')).toBeVisible()
  await page.getByTestId('stb-group').click()
  expect(await groupCount(page)).toBe(1)
})

test('Ungroup button appears for a container and dissolves it', async ({ page }) => {
  await seed(page, [
    { id: 'n1', type: 'basic:rectangle', x: 120, y: 240 },
    { id: 'n2', type: 'basic:rectangle', x: 360, y: 240 },
  ])
  await selectNodes(page, ['n1', 'n2'])
  await page.getByTestId('stb-group').click()
  // The new container is selected; the toolbar now offers Ungroup.
  await expect(page.getByTestId('stb-ungroup')).toBeVisible()
  await page.getByTestId('stb-ungroup').click()
  expect(await groupCount(page)).toBe(0)
})

test('edge selection shows stroke/line/arrows; Line width + End arrow apply', async ({ page }) => {
  await seed(
    page,
    [
      { id: 'n1', type: 'basic:rectangle', x: 120, y: 240 },
      { id: 'n2', type: 'basic:rectangle', x: 420, y: 240 },
    ],
    [{ id: 'e1', source: 'n1', target: 'n2' }],
  )
  await selectEdges(page, ['e1'])
  await expect(page.getByTestId('selection-toolbar')).toBeVisible()

  await page.getByTestId('stb-line').click()
  await page.getByTestId('stb-stroke-width').fill('6')
  expect((await edgeStyle(page, 'e1')).strokeWidth).toBe(6)

  await page.getByTestId('stb-arrows').click()
  await page.getByTestId('stb-marker-end').selectOption('arrow')
  expect((await edgeStyle(page, 'e1')).markerEnd).toBe('arrow')
})

test('toolbar hides when the selection is cleared', async ({ page }) => {
  await seed(page, [{ id: 'n1', type: 'arch-core:service', x: 300, y: 240 }])
  await selectNodes(page, ['n1'])
  await expect(page.getByTestId('selection-toolbar')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('selection-toolbar')).toHaveCount(0)
})
