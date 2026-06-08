import { expect, test } from '@playwright/test'

// The three PRD-defined acceptance flows:
// 1) cold start → first diagram (palette click adds a node)
// 2) localStorage persistence across reload
// 3) download .graffel round-trip is well-formed JSON with the right schema

test.beforeEach(async ({ page }) => {
  // Each test starts in a clean storage state.
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('cold start: empty canvas with palette and toolbar visible', async ({ page }) => {
  await expect(page.getByTestId('toolbar')).toBeVisible()
  await expect(page.getByTestId('palette')).toBeVisible()
  await expect(page.getByTestId('canvas-host')).toBeVisible()
  await expect(page.getByTestId('palette-service')).toBeVisible()
  await expect(page.getByTestId('palette-database')).toBeVisible()
})

test('click palette item to add shape to canvas', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  // The shape should render inside the canvas. New shapes start unlabeled, so
  // we assert presence by the icon body rather than any default text.
  const shape = page.getByTestId('shape-service')
  await expect(shape).toBeVisible()
  await expect(shape.locator('.graffel-shape-body svg')).toBeVisible()
})

test('add multiple shapes', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('palette-database').click()
  await page.getByTestId('palette-queue').click()
  // All three rendered.
  await expect(page.getByTestId('shape-service')).toBeVisible()
  await expect(page.getByTestId('shape-database')).toBeVisible()
  await expect(page.getByTestId('shape-queue')).toBeVisible()
})

test('autosave: shapes survive a page reload', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('palette-database').click()
  // Give the debounced autosave a beat to fire.
  await page.waitForTimeout(700)
  await page.reload()
  await expect(page.getByTestId('shape-service')).toBeVisible()
  await expect(page.getByTestId('shape-database')).toBeVisible()
})

test('title is editable and persists', async ({ page }) => {
  await page.getByTestId('title-input').fill('System architecture')
  await page.getByTestId('palette-service').click()
  await page.waitForTimeout(700)
  await page.reload()
  await expect(page.getByTestId('title-input')).toHaveValue('System architecture')
})

test('downloaded .graffel file is well-formed JSON with the expected schema', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('palette-database').click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('action-download').click(),
  ])
  const filename = download.suggestedFilename()
  expect(filename).toMatch(/\.graffel$/)
  const path = await download.path()
  expect(path).toBeTruthy()
  const fs = await import('node:fs/promises')
  const content = await fs.readFile(path!, 'utf-8')
  const json = JSON.parse(content)
  expect(json.format).toBe('graffel')
  expect(json.schemaVersion).toBe(1)
  expect(Array.isArray(json.nodes)).toBe(true)
  expect(json.nodes.length).toBe(2)
  // v3+ uses pack-qualified ids ('arch-core:service'); v1/v2 used short ('service').
  // Accept either form so the test survives the shape-registry refactor.
  expect(json.nodes[0].type).toMatch(/^(arch-core:)?service$/)
  expect(json.nodes[1].type).toMatch(/^(arch-core:)?database$/)
  expect(json.reserved).toBeDefined()
})

test('healthz endpoint responds via the same origin', async ({ request }) => {
  const res = await request.get('/healthz')
  expect(res.ok()).toBe(true)
  const body = await res.json()
  expect(body.status).toBe('ok')
})

test('shape label is editable via double-click', async ({ page }) => {
  await page.getByTestId('palette-service').click()
  const shape = page.getByTestId('shape-service')
  await shape.dblclick()
  const input = page.getByTestId('shape-label-input')
  await expect(input).toBeVisible()
  await input.fill('API Gateway')
  await input.press('Enter')
  await expect(shape).toContainText('API Gateway')
})
