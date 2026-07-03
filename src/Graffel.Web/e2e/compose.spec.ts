import { expect, test, type Page } from '@playwright/test'

// v3.27 — living diagrams (docker-compose). Point Graffel at a compose file and it
// generates an auto-laid-out architecture diagram: services become shapes (Postgres
// a database, Redis a cache, Nginx a gateway), depends_on becomes the wiring, and
// the source is remembered on the document for a future re-sync.

interface NodeState { id: string; type: string; parentId: string | null; data: { label: string }; position: { x: number; y: number } }

function graph(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as {
      __graffel: { useDiagramStore: { getState: () => { nodes: NodeState[]; edges: Array<{ source: string; target: string }>; documentSource?: { kind: string; text: string } | null } } }
    }
    const s = w.__graffel.useDiagramStore.getState()
    return { nodes: s.nodes as NodeState[], edges: s.edges, source: s.documentSource }
  })
}

async function freshApp(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('[data-testid="toolbar"]')
}

const COMPOSE = `services:
  web:
    image: nginx
    depends_on: [api]
  api:
    build: .
    depends_on: [db, cache]
  db:
    image: postgres:15
  cache:
    image: redis:7`

test('importing docker-compose generates a laid-out diagram with inferred shapes', async ({ page }) => {
  await freshApp(page)

  await page.getByTestId('action-compose').click()
  await expect(page.getByTestId('compose-dialog')).toBeVisible()
  await page.getByTestId('compose-input').fill(COMPOSE)
  await page.getByTestId('compose-import-run').click()

  // ELK lays out asynchronously; wait until all four services have landed.
  await expect.poll(async () => (await graph(page)).nodes.length, { timeout: 10000 }).toBe(4)

  const { nodes, edges } = await graph(page)
  const byLabel = Object.fromEntries(nodes.map((n) => [n.data.label, n]))
  expect(byLabel['db'].type).toBe('arch-core:database')
  expect(byLabel['cache'].type).toBe('arch-core:cache')
  expect(byLabel['web'].type).toBe('arch-core:api-gateway')
  expect(byLabel['api'].type).toBe('arch-core:service')

  // depends_on wiring: web→api, api→db, api→cache.
  expect(edges).toHaveLength(3)

  // Laid out left-to-right: the dependency graph advances along x, not piled at 0.
  expect(byLabel['api'].position.x).toBeGreaterThan(byLabel['web'].position.x)

  // Provenance is recorded so the diagram can later be re-synced from its source.
  const { source } = await graph(page)
  expect(source?.kind).toBe('compose')
  expect(source?.text).toContain('postgres')

  await expect(page.getByTestId('compose-dialog')).toHaveCount(0)
})

test('a malformed compose file surfaces an error and keeps the dialog open', async ({ page }) => {
  await freshApp(page)
  await page.getByTestId('action-compose').click()
  await page.getByTestId('compose-input').fill('version: "3.9"\n# no services here')
  await page.getByTestId('compose-import-run').click()

  await expect(page.getByTestId('dialog-error')).toBeVisible()
  await page.getByTestId('dialog-dismiss').click()
  await expect(page.getByTestId('compose-dialog')).toBeVisible()
})
