import { expect, test, type Page } from '@playwright/test'

// v3.15 — system-clipboard copy/cut/paste (incl. containers-with-contents and
// cross-diagram paste), copy-as-image, and drag-to-reconnect edge endpoints.

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

interface SeedNode { id: string; type: string; x: number; y: number; w?: number; h?: number; parentId?: string | null }
interface SeedEdge { id: string; source: string; target: string }

async function seed(page: Page, nodes: SeedNode[], edges: SeedEdge[] = []) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(({ ns, es }) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXCLIPDOCXXXXXXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-12T00:00:00Z', updatedAt: '2026-06-12T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: (ns as SeedNode[]).map((n) => ({
        id: n.id, type: n.type, parentId: n.parentId ?? null,
        position: { x: n.x, y: n.y }, size: { w: n.w ?? 120, h: n.h ?? 70 },
        data: { label: n.id },
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
  // Let the mount-time fitView animation (200ms) finish — tests below measure
  // element positions, which must not move mid-drag.
  await page.waitForTimeout(450)
}

function store(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => unknown } } }
    const s = w.__graffel.useDiagramStore.getState() as {
      nodes: Array<{ id: string; type: string; parentId: string | null; data: { label: string } }>
      edges: Array<{ id: string; source: string; target: string }>
      selectedNodeIds: string[]
    }
    return {
      nodes: s.nodes.map((n) => ({ id: n.id, type: n.type, parentId: n.parentId ?? null, label: n.data.label })),
      edges: s.edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      selected: s.selectedNodeIds,
    }
  })
}

async function selectNodes(page: Page, ids: string[]) {
  await page.evaluate((sel) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectNodes: (i: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectNodes(sel)
  }, ids)
}

test('Ctrl+C / Ctrl+V copies and pastes a node (original untouched, copy selected)', async ({ page }) => {
  await seed(page, [{ id: 'a', type: 'basic:rectangle', x: 200, y: 200 }])
  await selectNodes(page, ['a'])
  // Move the cursor somewhere distinct so paste-at-cursor is observable.
  await page.mouse.move(700, 400)
  await page.keyboard.press('Control+c')
  await page.keyboard.press('Control+v')
  await page.waitForTimeout(200)
  const s = await store(page)
  expect(s.nodes).toHaveLength(2)
  const pasted = s.nodes.find((n) => n.id !== 'a')!
  expect(pasted.label).toBe('a') // content travels
  expect(s.selected).toEqual([pasted.id])
})

test('copying a container brings its contents and internal edges, with remapped ids', async ({ page }) => {
  await seed(
    page,
    [
      { id: 'box', type: 'arch-core:boundary', x: 100, y: 100, w: 360, h: 240 },
      { id: 'k1', type: 'arch-core:service', x: 40, y: 60, w: 100, h: 70, parentId: 'box' },
      { id: 'k2', type: 'arch-core:database', x: 200, y: 60, w: 100, h: 70, parentId: 'box' },
    ],
    [{ id: 'e1', source: 'k1', target: 'k2' }],
  )
  await selectNodes(page, ['box'])
  await page.mouse.move(800, 500)
  await page.keyboard.press('Control+c')
  await page.keyboard.press('Control+v')
  await page.waitForTimeout(200)
  const s = await store(page)
  expect(s.nodes).toHaveLength(6)
  expect(s.edges).toHaveLength(2)
  const newBox = s.nodes.find((n) => n.type === 'arch-core:boundary' && n.id !== 'box')!
  const newKids = s.nodes.filter((n) => n.parentId === newBox.id)
  expect(newKids).toHaveLength(2)
  const newEdge = s.edges.find((e) => e.id !== 'e1')!
  const kidIds = newKids.map((k) => k.id)
  expect(kidIds).toContain(newEdge.source)
  expect(kidIds).toContain(newEdge.target)
})

test('paste survives New diagram (the cross-diagram move)', async ({ page }) => {
  await seed(page, [{ id: 'a', type: 'basic:rectangle', x: 200, y: 200 }])
  await selectNodes(page, ['a'])
  await page.keyboard.press('Control+c')
  // Fresh diagram (same as toolbar New, without the confirm dialog).
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { reset: () => void } } } }
    w.__graffel.useDiagramStore.getState().reset()
  })
  await page.waitForTimeout(100)
  await page.mouse.move(600, 300)
  await page.keyboard.press('Control+v')
  await page.waitForTimeout(200)
  const s = await store(page)
  expect(s.nodes).toHaveLength(1)
  expect(s.nodes[0]!.label).toBe('a')
})

test('Ctrl+X cuts: clipboard gets the shapes, originals are removed', async ({ page }) => {
  await seed(page, [
    { id: 'a', type: 'basic:rectangle', x: 200, y: 200 },
    { id: 'b', type: 'basic:rectangle', x: 400, y: 200 },
  ])
  await selectNodes(page, ['a'])
  await page.keyboard.press('Control+x')
  await page.waitForTimeout(200)
  let s = await store(page)
  expect(s.nodes.map((n) => n.id)).toEqual(['b'])
  await page.mouse.move(600, 400)
  await page.keyboard.press('Control+v')
  await page.waitForTimeout(200)
  s = await store(page)
  expect(s.nodes).toHaveLength(2) // b + pasted a
})

test('dragging an edge endpoint reconnects it to another shape (undoable)', async ({ page }) => {
  await seed(
    page,
    [
      { id: 'a', type: 'basic:rectangle', x: 100, y: 250 },
      { id: 'b', type: 'basic:rectangle', x: 420, y: 120 },
      { id: 'c', type: 'basic:rectangle', x: 420, y: 400 },
    ],
    [{ id: 'e1', source: 'a', target: 'b' }],
  )
  // Drag the target endpoint (at b's left handle) onto c's left handle. The
  // reconnect anchor is a 10px-radius circle around the endpoint, but the node's
  // own connection handle div sits on top of the exact center — so grab a point
  // just OUTSIDE the node box (still inside the anchor disc).
  const bHandle = page.locator('.react-flow__node[data-id="b"] .react-flow__handle-left').first()
  const cHandle = page.locator('.react-flow__node[data-id="c"] .react-flow__handle-left').first()
  const from = await bHandle.boundingBox()
  const to = await cHandle.boundingBox()
  expect(from && to).toBeTruthy()
  // Grab between the handle's edge (0.5×width from center) and the anchor disc's
  // rim (1.0×width) — both scale with zoom, so 0.75×width always lands on the
  // anchor circle and never on the handle.
  await page.mouse.move(from!.x + from!.width / 2 - from!.width * 0.75, from!.y + from!.height / 2)
  await page.mouse.down()
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(200)
  let s = await store(page)
  expect(s.edges[0]!.target).toBe('c')
  await page.keyboard.press('Control+z')
  s = await store(page)
  expect(s.edges[0]!.target).toBe('b')
})

test('"Copy image" puts a PNG on the clipboard', async ({ page }) => {
  await seed(page, [{ id: 'a', type: 'arch-core:service', x: 300, y: 250 }])
  await page.getByTestId('action-copy-png').click()
  await expect(page.getByTestId('action-copy-png')).toHaveText('✓ Copied!')
  const hasPng = await page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    return items.some((i) => i.types.includes('image/png'))
  })
  expect(hasPng).toBe(true)
})
