import { expect, test } from '@playwright/test'

// v2.1 Drive flows — exercised against the in-memory IDriveStore via TestAuthHandler.

test.use({ extraHTTPHeaders: { 'X-Test-User': 'drive-user@example.com|Drive User' } })

test.beforeEach(async ({ page, request }) => {
  // Reset both the diagram (localStorage) and the in-memory Drive store
  // (delete all files this user has).
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  const list = await request.get('/api/drive/files')
  if (list.ok()) {
    const files = await list.json() as Array<{ id: string }>
    for (const f of files) {
      await request.delete(`/api/drive/files/${f.id}`)
    }
  }
  await page.reload()
})

test('drive menu is visible when signed in', async ({ page }) => {
  await expect(page.getByTestId('drive-menu')).toBeVisible()
  await expect(page.getByTestId('drive-save')).toBeVisible()
  await expect(page.getByTestId('drive-open')).toBeVisible()
})

test('Save to Drive creates a new file with the current diagram', async ({ page, request }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('title-input').fill('System architecture')

  await page.getByTestId('drive-save').click()
  await expect(page.getByTestId('drive-status')).toContainText('Saved to Drive')

  // Verify the file shows up on the backend.
  const res = await request.get('/api/drive/files')
  const files = await res.json() as Array<{ id: string; name: string }>
  expect(files).toHaveLength(1)
  expect(files[0]!.name).toBe('System architecture.graffel')
})

test('A second save updates the same file (not a duplicate)', async ({ page, request }) => {
  await page.getByTestId('palette-service').click()
  await page.getByTestId('drive-save').click()
  await expect(page.getByTestId('drive-status')).toContainText('Saved to Drive')

  // Modify the title and save again.
  await page.getByTestId('title-input').fill('System architecture v2')
  // Wait a beat for the status to clear before clicking save again.
  await page.waitForTimeout(2700)
  await page.getByTestId('drive-save').click()
  await expect(page.getByTestId('drive-status')).toContainText('Saved to Drive')

  const res = await request.get('/api/drive/files')
  const files = await res.json() as Array<{ id: string; name: string }>
  expect(files).toHaveLength(1)
  expect(files[0]!.name).toBe('System architecture v2.graffel')
})

test('Open from Drive lists files and loads one', async ({ page, request }) => {
  // Seed a file directly via the API.
  const seedBody = JSON.stringify({
    format: 'graffel',
    schemaVersion: 1,
    id: '01HXSEEDXXXXXXXXXXXXXXXXXX',
    metadata: { title: 'Seeded', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', appVersion: '0.1.0' },
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      { id: 'n_1', type: 'database', position: { x: 80, y: 80 }, size: { w: 120, h: 90 }, data: { label: 'Postgres' } },
    ],
    edges: [],
    reserved: { remote: null, ops: null },
  })
  await request.post('/api/drive/files', {
    data: { name: 'Seeded.graffel', body: seedBody },
  })

  await page.getByTestId('drive-open').click()
  await expect(page.getByTestId('drive-list')).toBeVisible()
  await page.getByTestId('drive-file-Seeded.graffel').click()

  // The seeded diagram's database node should now be on the canvas.
  await expect(page.getByTestId('shape-database')).toBeVisible()
  await expect(page.getByTestId('shape-database')).toContainText('Postgres')
  // Title also updated from the loaded doc.
  await expect(page.getByTestId('title-input')).toHaveValue('Seeded')
})

test('Open from Drive shows empty state when the user has no files', async ({ page }) => {
  await page.getByTestId('drive-open').click()
  await expect(page.getByTestId('drive-list')).toBeVisible()
  await expect(page.getByTestId('drive-list')).toContainText('No Graffel files')
})

test.describe('signed out', () => {
  test.use({ extraHTTPHeaders: {} })

  test('drive menu is hidden when not signed in', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('drive-menu')).toHaveCount(0)
    await expect(page.getByTestId('auth-signin')).toBeVisible()
  })
})
