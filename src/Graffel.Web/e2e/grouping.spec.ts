import { expect, test, type Page } from '@playwright/test'

// v3.11 — containers & grouping. Ctrl+G wraps a selection in a container that
// moves together; dragging a shape onto a container nests it (drag out to
// release); deleting a container takes its contents (undo restores).

interface SeedNode {
  id: string
  type: string
  x: number
  y: number
  w?: number
  h?: number
  parentId?: string | null
}

async function seed(page: Page, nodes: SeedNode[]) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate((ns) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXGROUPINGDOCXXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-09T00:00:00Z', updatedAt: '2026-06-09T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: (ns as SeedNode[]).map((n) => ({
        id: n.id, type: n.type, parentId: n.parentId ?? null,
        position: { x: n.x, y: n.y }, size: { w: n.w ?? 140, h: n.h ?? 80 },
        data: { label: '' },
      })),
      edges: [],
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  }, nodes)
  await page.reload()
  await page.waitForSelector('.react-flow__node')
}

function store(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => unknown } } }
    return w.__graffel.useDiagramStore.getState() as {
      nodes: Array<{ id: string; type: string; parentId: string | null; position: { x: number; y: number } }>
    }
  })
}

async function selectNodes(page: Page, ids: string[]) {
  await page.evaluate((sel) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectNodes: (i: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectNodes(sel)
  }, ids)
}

async function nodeCenter(page: Page, id: string) {
  return page.evaluate((nid) => {
    const el = document.querySelector(`.react-flow__node[data-id="${nid}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }, id)
}

test('Ctrl+G groups a selection into a container that moves together; Ctrl+Shift+G ungroups', async ({ page }) => {
  await seed(page, [
    { id: 'n1', type: 'basic:rectangle', x: 100, y: 140 },
    { id: 'n2', type: 'basic:rectangle', x: 360, y: 140 },
  ])
  await selectNodes(page, ['n1', 'n2'])
  await page.keyboard.press('Control+g')

  // A container node now exists and both rects are its children.
  let s = await store(page)
  const group = s.nodes.find((n) => n.type === 'basic:group')
  expect(group).toBeTruthy()
  const gid = group!.id
  expect(s.nodes.find((n) => n.id === 'n1')!.parentId).toBe(gid)
  expect(s.nodes.find((n) => n.id === 'n2')!.parentId).toBe(gid)
  await expect(page.locator(`.react-flow__node[data-id="${gid}"]`)).toBeVisible()

  // Moving the container moves the children with it (parent drag → child follows).
  const before = await nodeCenter(page, 'n1')
  await page.evaluate((id) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ id: string; position: { x: number; y: number } }>; updateNodePosition: (i: string, p: { x: number; y: number }) => void } } } }
    const st = w.__graffel.useDiagramStore.getState()
    const g = st.nodes.find((n) => n.id === id)!
    st.updateNodePosition(id, { x: g.position.x + 80, y: g.position.y })
  }, gid)
  await page.waitForTimeout(50)
  const after = await nodeCenter(page, 'n1')
  expect(after!.x - before!.x).toBeGreaterThan(50) // ~80 * zoom

  // Ungroup: select the container, Ctrl+Shift+G → container gone, rects survive.
  await selectNodes(page, [gid])
  await page.keyboard.press('Control+Shift+g')
  s = await store(page)
  expect(s.nodes.find((n) => n.type === 'basic:group')).toBeUndefined()
  expect(s.nodes.map((n) => n.id).sort()).toEqual(['n1', 'n2'])
  expect(s.nodes.find((n) => n.id === 'n1')!.parentId ?? null).toBeNull()
})

test('dragging a shape onto a container nests it; dragging out releases it', async ({ page }) => {
  await seed(page, [
    { id: 'box', type: 'arch-core:boundary', x: 80, y: 80, w: 360, h: 240 },
    { id: 'r1', type: 'basic:rectangle', x: 560, y: 160, w: 120, h: 70 },
  ])

  // Drag r1 onto the container's center → it becomes a child.
  const start = (await nodeCenter(page, 'r1'))!
  const boxC = (await nodeCenter(page, 'box'))!
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(boxC.x, boxC.y, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(50)
  expect((await store(page)).nodes.find((n) => n.id === 'r1')!.parentId).toBe('box')

  // Drag it far outside the container → released back to top level.
  const inside = (await nodeCenter(page, 'r1'))!
  await page.mouse.move(inside.x, inside.y)
  await page.mouse.down()
  await page.mouse.move(boxC.x + 600, boxC.y, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(50)
  expect((await store(page)).nodes.find((n) => n.id === 'r1')!.parentId ?? null).toBeNull()
})

test('deleting a container deletes its contents, and undo restores them', async ({ page }) => {
  await seed(page, [
    { id: 'n1', type: 'basic:rectangle', x: 100, y: 140 },
    { id: 'n2', type: 'basic:rectangle', x: 360, y: 140 },
  ])
  await selectNodes(page, ['n1', 'n2'])
  await page.keyboard.press('Control+g')
  const gid = (await store(page)).nodes.find((n) => n.type === 'basic:group')!.id

  await selectNodes(page, [gid])
  await page.keyboard.press('Delete')
  expect((await store(page)).nodes).toHaveLength(0)

  await page.keyboard.press('Control+z')
  expect((await store(page)).nodes).toHaveLength(3)
})
