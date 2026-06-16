import { expect, test, type Page } from '@playwright/test'

// v3.20 — container auto-grow: dragging a child to a container's edge grows the
// container so it never clips its contents.

interface SeedNode { id: string; type: string; x: number; y: number; w?: number; h?: number; parentId?: string | null }

async function seed(page: Page, nodes: SeedNode[]) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate((ns) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXGROWDOCXXXXXXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-15T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: (ns as SeedNode[]).map((n) => ({
        id: n.id, type: n.type, parentId: n.parentId ?? null,
        position: { x: n.x, y: n.y }, size: { w: n.w ?? 120, h: n.h ?? 70 },
        data: { label: n.id },
      })),
      edges: [], reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  }, nodes)
  await page.reload()
  await page.waitForSelector('.react-flow__node')
  await page.waitForTimeout(450)
}

function nodeInfo(page: Page, id: string) {
  return page.evaluate((nid) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ id: string; parentId: string | null; position: { x: number; y: number }; size: { w: number; h: number } }> } } } }
    const n = w.__graffel.useDiagramStore.getState().nodes.find((x) => x.id === nid)!
    return { parentId: n.parentId ?? null, position: n.position, size: n.size }
  }, id)
}

test('dragging a child to the edge grows the container to keep it inside', async ({ page }) => {
  await seed(page, [
    { id: 'box', type: 'arch-core:boundary', x: 100, y: 100, w: 300, h: 200 },
    { id: 'kid', type: 'basic:rectangle', x: 40, y: 40, w: 120, h: 70, parentId: 'box' },
  ])

  const before = await nodeInfo(page, 'box')
  expect(before.size.w).toBe(300)

  // Drag the child rightwards so its right edge pokes past the container, while
  // its center stays inside (so it remains parented). Convert flow delta → screen
  // using the live zoom.
  const zoom = await page.evaluate(() => {
    const w = window as unknown as { __graffelRf: { getViewport: () => { zoom: number } } }
    return w.__graffelRf.getViewport().zoom
  })
  const kid = page.locator('.react-flow__node[data-id="kid"]')
  const box = (await kid.boundingBox())!
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 160 * zoom, cy, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(250)

  const after = await nodeInfo(page, 'box')
  const child = await nodeInfo(page, 'kid')
  // The container grew and the child is still its child.
  expect(after.size.w).toBeGreaterThan(before.size.w)
  expect(child.parentId).toBe('box')
  // Child's right edge sits within the (grown) container.
  expect(child.position.x + child.size.w).toBeLessThanOrEqual(after.size.w)
})
