import { expect, test, type Page } from '@playwright/test'

// v3.20 — "Tidy up" one-shot auto-layout (ELK). Arranges the current level's
// shapes into a clean hierarchy, as a single undoable step.

interface SeedNode { id: string; type: string; x: number; y: number; w?: number; h?: number }
interface SeedEdge { id: string; source: string; target: string }

async function seed(page: Page, nodes: SeedNode[], edges: SeedEdge[] = []) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(({ ns, es }) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXLAYOUTDOCXXXXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-15T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: (ns as SeedNode[]).map((n) => ({
        id: n.id, type: n.type, parentId: null,
        position: { x: n.x, y: n.y }, size: { w: n.w ?? 120, h: n.h ?? 70 },
        data: { label: n.id },
      })),
      edges: (es as SeedEdge[]).map((e) => ({
        id: e.id, source: e.source, target: e.target,
        sourceHandle: 'right', targetHandle: 'left', type: 'orthogonal',
        data: { label: '', waypoints: [] },
      })),
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  }, { ns: nodes, es: edges })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
  await page.waitForTimeout(300)
}

function positions(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ id: string; position: { x: number; y: number } }> } } } }
    const out: Record<string, { x: number; y: number }> = {}
    for (const n of w.__graffel.useDiagramStore.getState().nodes) out[n.id] = { x: n.position.x, y: n.position.y }
    return out
  })
}

// Three nodes piled on top of each other, chained a→b→c.
const PILE: SeedNode[] = [
  { id: 'a', type: 'basic:rectangle', x: 200, y: 200 },
  { id: 'b', type: 'basic:rectangle', x: 210, y: 205 },
  { id: 'c', type: 'basic:rectangle', x: 205, y: 210 },
]
const CHAIN: SeedEdge[] = [
  { id: 'e1', source: 'a', target: 'b' },
  { id: 'e2', source: 'b', target: 'c' },
]

test('Tidy up arranges piled-up shapes into a clean left-to-right chain', async ({ page }) => {
  await seed(page, PILE, CHAIN)
  const before = await positions(page)
  // They start overlapping.
  expect(Math.abs(before.a!.x - before.b!.x)).toBeLessThan(40)

  await page.getByTestId('action-tidy-up').click()
  // ELK loads lazily on first use, then applies — wait for positions to change.
  await expect.poll(async () => (await positions(page)).a!.x !== before.a!.x, { timeout: 10000 }).toBe(true)

  const after = await positions(page)
  // Following the chain, each node lands strictly to the right of the previous,
  // separated by at least a node width (no more overlap along the flow).
  expect(after.b!.x).toBeGreaterThan(after.a!.x)
  expect(after.c!.x).toBeGreaterThan(after.b!.x)
  expect(after.b!.x - after.a!.x).toBeGreaterThanOrEqual(120)
})

test('Tidy up is a single undo step', async ({ page }) => {
  await seed(page, PILE, CHAIN)
  const before = await positions(page)
  await page.getByTestId('action-tidy-up').click()
  await expect.poll(async () => (await positions(page)).a!.x !== before.a!.x, { timeout: 10000 }).toBe(true)

  await page.keyboard.press('Control+z')
  await page.waitForTimeout(150)
  const restored = await positions(page)
  for (const id of ['a', 'b', 'c']) {
    expect(restored[id]).toEqual(before[id])
  }
})

test('Tidy up is available from the command palette', async ({ page }) => {
  await seed(page, PILE, CHAIN)
  const before = await positions(page)
  await page.keyboard.press('/')
  await expect(page.getByTestId('command-palette')).toBeVisible()
  await page.keyboard.type('tidy')
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await positions(page)).a!.x !== before.a!.x, { timeout: 10000 }).toBe(true)
  const after = await positions(page)
  expect(after.c!.x).toBeGreaterThan(after.a!.x)
})
