import { expect, test, type Page } from '@playwright/test'

// v3.24 — Mermaid interop. Paste a flowchart and it opens as a laid-out diagram;
// the current level exports back to Mermaid text.

interface NodeState { id: string; type: string; parentId: string | null; data: { label: string }; position: { x: number; y: number } }

function nodes(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as {
      __graffel: { useDiagramStore: { getState: () => { nodes: NodeState[]; edges: Array<{ source: string; target: string }> } } }
    }
    const s = w.__graffel.useDiagramStore.getState()
    return { nodes: s.nodes as NodeState[], edges: s.edges }
  })
}

async function freshApp(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('[data-testid="toolbar"]')
}

const SOURCE = `graph LR
  Web[Web App] --> API{Auth?}
  API -->|yes| Orders[Orders Service]
  Orders --> DB[(Database)]`

test('importing Mermaid opens a laid-out diagram with the right shapes', async ({ page }) => {
  await freshApp(page)

  await page.getByTestId('action-mermaid').click()
  await expect(page.getByTestId('mermaid-dialog')).toBeVisible()
  await page.getByTestId('mermaid-input').fill(SOURCE)
  await page.getByTestId('mermaid-import-run').click()

  // ELK lays out asynchronously; wait until four nodes have landed.
  await expect.poll(async () => (await nodes(page)).nodes.length, { timeout: 10000 }).toBe(4)

  const { nodes: ns, edges } = await nodes(page)
  const byLabel = Object.fromEntries(ns.map((n) => [n.data.label, n]))
  expect(byLabel['Web App'].type).toBe('basic:rectangle')
  expect(byLabel['Auth?'].type).toBe('basic:diamond')
  expect(byLabel['Database'].type).toBe('arch-core:database')
  expect(edges).toHaveLength(3)

  // Laid out left-to-right: the flow advances along x, not piled at the origin.
  expect(byLabel['Orders Service'].position.x).toBeGreaterThan(byLabel['Web App'].position.x)

  // The dialog closed on success.
  await expect(page.getByTestId('mermaid-dialog')).toHaveCount(0)
})

test('a malformed source surfaces an error and keeps the dialog open', async ({ page }) => {
  await freshApp(page)
  await page.getByTestId('action-mermaid').click()
  await page.getByTestId('mermaid-input').fill('this is not mermaid at all')
  await page.getByTestId('mermaid-import-run').click()

  await expect(page.getByTestId('dialog-error')).toBeVisible()
  await page.getByTestId('dialog-dismiss').click()
  // Still on the import dialog so the user can fix the text.
  await expect(page.getByTestId('mermaid-dialog')).toBeVisible()
})

const NESTED = `graph TD
  subgraph Backend[Backend Services]
    API{Auth?} --> DB[(Database)]
  end
  Web[Web App] --> API`

test('a subgraph imports as a drillable container holding its members', async ({ page }) => {
  await freshApp(page)
  await page.getByTestId('action-mermaid').click()
  await page.getByTestId('mermaid-input').fill(NESTED)
  await page.getByTestId('mermaid-import-run').click()
  await expect.poll(async () => (await nodes(page)).nodes.length, { timeout: 10000 }).toBe(4)

  const { nodes: ns } = await nodes(page)
  const byLabel = Object.fromEntries(ns.map((n) => [n.data.label, n]))
  const backend = byLabel['Backend Services']
  expect(backend.type).toBe('basic:group')
  // API and DB are parented to the container; Web is top-level.
  expect(byLabel['Auth?'].parentId).toBe(backend.id)
  expect(byLabel['Database'].parentId).toBe(backend.id)
  expect(byLabel['Web App'].parentId).toBeNull()

  // The container is sized to actually hold its members (not the 240×160 default).
  const big = await page.evaluate((id) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: NodeState[] } } } }
    const n = w.__graffel.useDiagramStore.getState().nodes.find((x) => x.id === id) as unknown as { size: { w: number; h: number } }
    return n.size
  }, backend.id)
  expect(big.w).toBeGreaterThan(0)

  // Drilling into it shows its members as the current level.
  await page.evaluate((id) => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { enterContainer: (id: string) => void } } } }
    w.__graffel.useDiagramStore.getState().enterContainer(id)
  }, backend.id)
  await expect.poll(async () => {
    const v = await page.evaluate(() => {
      const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { viewRootId: string | null } } } }
      return w.__graffel.useDiagramStore.getState().viewRootId
    })
    return v
  }).toBe(backend.id)
})

test('exporting a nested diagram emits subgraph blocks', async ({ page }) => {
  await freshApp(page)
  await page.getByTestId('action-mermaid').click()
  await page.getByTestId('mermaid-input').fill(NESTED)
  await page.getByTestId('mermaid-import-run').click()
  await expect.poll(async () => (await nodes(page)).nodes.length, { timeout: 10000 }).toBe(4)

  await page.keyboard.press('/')
  await expect(page.getByTestId('command-palette')).toBeVisible()
  await page.getByTestId('palette-input').fill('Export to Mermaid')
  await page.keyboard.press('Enter')

  const text = await page.getByTestId('mermaid-output').inputValue()
  expect(text).toContain('subgraph')
  expect(text).toContain('"Backend Services"')
  expect(text).toContain('end')
})

test('exporting produces Mermaid for the current diagram', async ({ page }) => {
  await freshApp(page)

  // Import first so there's something to export, then re-open in export mode.
  await page.getByTestId('action-mermaid').click()
  await page.getByTestId('mermaid-input').fill(SOURCE)
  await page.getByTestId('mermaid-import-run').click()
  await expect.poll(async () => (await nodes(page)).nodes.length, { timeout: 10000 }).toBe(4)

  await page.keyboard.press('/')
  await expect(page.getByTestId('command-palette')).toBeVisible()
  await page.keyboard.type('Export to Mermaid')
  await page.keyboard.press('Enter')

  const out = page.getByTestId('mermaid-output')
  await expect(out).toBeVisible()
  const text = await out.inputValue()
  expect(text).toMatch(/^graph TD/)
  expect(text).toContain('["Web App"]')
  expect(text).toContain('{"Auth?"}')
  expect(text).toContain('[("Database")]')
  expect(text).toContain('-->')
})
