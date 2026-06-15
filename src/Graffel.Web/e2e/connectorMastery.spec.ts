import { expect, test, type Page } from '@playwright/test'

// v3.19 — Connector mastery: floating edges (attach to the nearest perimeter and
// re-attach as nodes move), obstacle-aware orthogonal routing (bend around boxes
// instead of through them), and slideable edge labels.

interface SeedNode { id: string; type: string; x: number; y: number; w?: number; h?: number }
interface SeedEdge { id: string; source: string; target: string; type?: string; label?: string }

async function seed(page: Page, nodes: SeedNode[], edges: SeedEdge[] = []) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(({ ns, es }) => {
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXCONNDOCXXXXXXXXXXXXXXX',
      metadata: { title: 't', createdAt: '2026-06-15T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: (ns as SeedNode[]).map((n) => ({
        id: n.id, type: n.type, parentId: null,
        position: { x: n.x, y: n.y }, size: { w: n.w ?? 120, h: n.h ?? 70 },
        data: { label: n.id },
      })),
      edges: (es as SeedEdge[]).map((e) => ({
        id: e.id, source: e.source, target: e.target,
        sourceHandle: 'right', targetHandle: 'left', type: e.type ?? 'orthogonal',
        data: { label: e.label ?? '', waypoints: [] },
      })),
      reserved: { remote: null, ops: null },
    }
    localStorage.setItem('graffel.currentDocument.v1', JSON.stringify(doc))
  }, { ns: nodes, es: edges })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
  await page.waitForTimeout(450) // let the mount-time fitView animation settle
}

/** The "d" attribute of an edge's rendered path. */
async function pathD(page: Page, edgeId: string): Promise<string> {
  return page.locator(`.react-flow__edge[data-id="${edgeId}"] .react-flow__edge-path`).getAttribute('d').then((d) => d ?? '')
}

/** Coordinate pairs from M/L path commands (our routed polylines are pure M/L). */
function parsePoints(d: string): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = []
  const re = /[ML]\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) pts.push({ x: parseFloat(m[1]!), y: parseFloat(m[2]!) })
  return pts
}

async function moveNode(page: Page, id: string, x: number, y: number) {
  await page.evaluate(({ id, x, y }) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { updateNodePosition: (i: string, p: { x: number; y: number }) => void } } } }
    w.__graffel.useDiagramStore.getState().updateNodePosition(id, { x, y })
  }, { id, x, y })
  await page.waitForTimeout(150)
}

function edgeLabelT(page: Page, edgeId: string) {
  return page.evaluate((eid) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { edges: Array<{ id: string; data: { labelT?: number } }> } } } }
    return w.__graffel.useDiagramStore.getState().edges.find((e) => e.id === eid)?.data.labelT
  }, edgeId)
}

test('a floating edge attaches to the node perimeter facing the other node', async ({ page }) => {
  // a at (100,100) 120x70 -> center (160,135), right edge x=220. b is to the right.
  await seed(
    page,
    [
      { id: 'a', type: 'basic:rectangle', x: 100, y: 100 },
      { id: 'b', type: 'basic:rectangle', x: 400, y: 100 },
    ],
    [{ id: 'e1', source: 'a', target: 'b' }],
  )
  const start = parsePoints(await pathD(page, 'e1'))[0]!
  // Leaves a's RIGHT edge, centered vertically.
  expect(start.x).toBeGreaterThan(210)
  expect(Math.abs(start.y - 135)).toBeLessThan(8)
})

test('a floating edge re-attaches to a different side when the target moves', async ({ page }) => {
  await seed(
    page,
    [
      { id: 'a', type: 'basic:rectangle', x: 100, y: 100 },
      { id: 'b', type: 'basic:rectangle', x: 400, y: 100 },
    ],
    [{ id: 'e1', source: 'a', target: 'b' }],
  )
  // Move b directly BELOW a. Source attachment should swing to a's bottom edge.
  await moveNode(page, 'b', 100, 400)
  const start = parsePoints(await pathD(page, 'e1'))[0]!
  // a bottom edge: x≈160 (center), y≈170 (100+70).
  expect(Math.abs(start.x - 160)).toBeLessThan(8)
  expect(start.y).toBeGreaterThan(160)
})

test('an orthogonal edge routes AROUND an obstacle instead of through it', async ({ page }) => {
  // a (left) and b (right) aligned on y; m sits squarely between them.
  await seed(
    page,
    [
      { id: 'a', type: 'basic:rectangle', x: 60, y: 200 },
      { id: 'm', type: 'basic:rectangle', x: 300, y: 180, w: 120, h: 110 },
      { id: 'b', type: 'basic:rectangle', x: 600, y: 200 },
    ],
    [{ id: 'e1', source: 'a', target: 'b' }],
  )
  const pts = parsePoints(await pathD(page, 'e1'))
  // A clear straight shot would be 2 points; routing around adds corners.
  expect(pts.length).toBeGreaterThan(2)
  // The detour clears the obstacle vertically: some point is above m's top (180)
  // or below its bottom (290), beyond the routing margin.
  const above = pts.some((p) => p.y <= 180 - 6)
  const below = pts.some((p) => p.y >= 290 + 6)
  expect(above || below).toBe(true)
  // And no point of the path sits inside the obstacle's interior.
  const inside = pts.some((p) => p.x > 300 && p.x < 420 && p.y > 180 && p.y < 290)
  expect(inside).toBe(false)
})

test('a straight obstacle-free edge stays a simple 2-point line', async ({ page }) => {
  await seed(
    page,
    [
      { id: 'a', type: 'basic:rectangle', x: 100, y: 200 },
      { id: 'b', type: 'basic:rectangle', x: 500, y: 200 },
    ],
    [{ id: 'e1', source: 'a', target: 'b' }],
  )
  expect(parsePoints(await pathD(page, 'e1')).length).toBe(2)
})

test('dragging an edge label slides it along the connector', async ({ page }) => {
  await seed(
    page,
    [
      { id: 'a', type: 'basic:rectangle', x: 100, y: 200 },
      { id: 'b', type: 'basic:rectangle', x: 600, y: 200 },
    ],
    [{ id: 'e1', source: 'a', target: 'b', label: 'calls' }],
  )
  // Default label sits at the midpoint (t = 0.5, unset).
  expect(await edgeLabelT(page, 'e1')).toBeUndefined()
  const label = page.getByTestId('edge-label-e1')
  const box = (await label.boundingBox())!
  // Drag the label toward the source (leftward).
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(150)
  const t = await edgeLabelT(page, 'e1')
  expect(t).toBeDefined()
  expect(t!).toBeLessThan(0.45)
})
