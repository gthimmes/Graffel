import { expect, test, type Page } from '@playwright/test'

// v3.13 — pointer tools (Select/Hand), rubber-band multi-select, and a node
// right-click menu with z-ordering.

interface SeedNode { id: string; type: string; x: number; y: number; w?: number; h?: number }

async function seed(page: Page, nodes: SeedNode[]) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate((ns) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXTOOLSZDOCXXXXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-10T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: (ns as SeedNode[]).map((n) => ({
        id: n.id, type: n.type, parentId: null,
        position: { x: n.x, y: n.y }, size: { w: n.w ?? 120, h: n.h ?? 70 },
        data: { label: '' },
      })),
      edges: [], reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  }, nodes)
  await page.reload()
  await page.waitForSelector('.react-flow__node')
}

function selectedIds(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectedNodeIds: string[] } } } }
    return w.__graffel.useDiagramStore.getState().selectedNodeIds
  })
}
function nodeOrder(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ id: string }> } } } }
    return w.__graffel.useDiagramStore.getState().nodes.map((n) => n.id)
  })
}
function groupCount(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ type: string }> } } } }
    return w.__graffel.useDiagramStore.getState().nodes.filter((n) => n.type === 'basic:group').length
  })
}
async function rect(page: Page, id: string) {
  return (await page.evaluate((nid) => {
    const el = document.querySelector(`.react-flow__node[data-id="${nid}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  }, id))!
}

test('Select tool: rubber-band drag multi-selects, then Ctrl+G groups', async ({ page }) => {
  await seed(page, [
    { id: 'n1', type: 'basic:rectangle', x: 150, y: 180 },
    { id: 'n2', type: 'basic:rectangle', x: 360, y: 180 },
  ])
  // Select tool is the default.
  await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true')

  const a = await rect(page, 'n1')
  const b = await rect(page, 'n2')
  const left = Math.min(a.left, b.left), top = Math.min(a.top, b.top)
  const right = Math.max(a.right, b.right), bottom = Math.max(a.bottom, b.bottom)
  // Drag a box from just outside the top-left to just outside the bottom-right.
  await page.mouse.move(left - 30, top - 30)
  await page.mouse.down()
  await page.mouse.move((left + right) / 2, (top + bottom) / 2, { steps: 8 })
  await page.mouse.move(right + 30, bottom + 30, { steps: 8 })
  await page.mouse.up()

  expect((await selectedIds(page)).sort()).toEqual(['n1', 'n2'])

  await page.keyboard.press('Control+g')
  expect(await groupCount(page)).toBe(1)
})

test('Hand tool toggle reflects in the toolbar + canvas', async ({ page }) => {
  await seed(page, [{ id: 'n1', type: 'basic:rectangle', x: 200, y: 200 }])
  await page.getByTestId('tool-pan').click()
  await expect(page.getByTestId('tool-pan')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('canvas-host')).toHaveAttribute('data-tool', 'pan')
  await page.getByTestId('tool-select').click()
  await expect(page.getByTestId('canvas-host')).toHaveAttribute('data-tool', 'select')
})

test('node right-click menu sends to back and brings to front (changes stack order)', async ({ page }) => {
  await seed(page, [
    { id: 'a', type: 'basic:rectangle', x: 120, y: 160 },
    { id: 'b', type: 'basic:rectangle', x: 300, y: 160 },
    { id: 'c', type: 'basic:rectangle', x: 480, y: 160 },
  ])
  expect(await nodeOrder(page)).toEqual(['a', 'b', 'c'])

  // Right-click c → Send to back → c moves to the front of the array.
  await page.locator('.react-flow__node[data-id="c"]').click({ button: 'right' })
  await expect(page.getByTestId('node-context-menu')).toBeVisible()
  await page.getByTestId('node-ctx-back').click()
  expect(await nodeOrder(page)).toEqual(['c', 'a', 'b'])

  // Right-click a → Bring to front → a moves to the end (top of stack).
  await page.locator('.react-flow__node[data-id="a"]').click({ button: 'right' })
  await page.getByTestId('node-ctx-front').click()
  expect(await nodeOrder(page)).toEqual(['c', 'b', 'a'])
})

async function selectNodes(page: Page, ids: string[]) {
  await page.evaluate((sel) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { selectNodes: (i: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().selectNodes(sel)
  }, ids)
}

// Rendered z-index of a node (what the user actually sees), not just store order.
function renderedZ(page: Page, id: string) {
  return page.evaluate((nid) => {
    const el = document.querySelector(`.react-flow__node[data-id="${nid}"]`) as HTMLElement | null
    if (!el) return null
    return Number(el.style.zIndex || getComputedStyle(el).zIndex || '0')
  }, id)
}

test('z-order changes the RENDERED stacking immediately — even while the node stays selected', async ({ page }) => {
  // Regression: selecting a node used to elevate it (z-index 1000), which masked
  // send-to-back / bring-to-front entirely until you clicked away.
  await seed(page, [
    { id: 'a', type: 'basic:rectangle', x: 200, y: 200, w: 200, h: 140 },
    { id: 'b', type: 'basic:rectangle', x: 280, y: 260, w: 200, h: 140 },
  ])
  // b is last in the array → renders above a.
  expect(await renderedZ(page, 'b')).toBeGreaterThan((await renderedZ(page, 'a'))!)

  // Select b and send it to back via the keyboard-equivalent store action while
  // it remains selected; the rendered z must flip right away.
  await selectNodes(page, ['b'])
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { sendToBack: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().sendToBack(['b'])
  })
  await page.waitForTimeout(100)
  expect(await renderedZ(page, 'a')).toBeGreaterThan((await renderedZ(page, 'b'))!)

  // Bring b back to front — again visible while still selected.
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { bringToFront: (ids: string[]) => void } } } }
    w.__graffel.useDiagramStore.getState().bringToFront(['b'])
  })
  await page.waitForTimeout(100)
  expect(await renderedZ(page, 'b')).toBeGreaterThan((await renderedZ(page, 'a'))!)
})

test('a container always renders behind its children (depth-ordered z)', async ({ page }) => {
  await seed(page, [
    { id: 'a', type: 'basic:rectangle', x: 120, y: 160 },
    { id: 'b', type: 'basic:rectangle', x: 360, y: 160 },
  ])
  await selectNodes(page, ['a', 'b'])
  await page.keyboard.press('Control+g')
  await page.waitForTimeout(150)
  const gid = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: Array<{ id: string; type: string }> } } } }
    return w.__graffel.useDiagramStore.getState().nodes.find((n) => n.type === 'basic:group')!.id
  })
  // The group (container) must sit below both of its children.
  const gz = (await renderedZ(page, gid))!
  expect((await renderedZ(page, 'a'))!).toBeGreaterThan(gz)
  expect((await renderedZ(page, 'b'))!).toBeGreaterThan(gz)
})
