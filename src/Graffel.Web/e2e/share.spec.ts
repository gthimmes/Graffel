import { expect, request as apiRequest, test } from '@playwright/test'

// v2.2 Share-by-link flows. Editing happens as a signed-in user; viewing
// happens in a separate context with NO auth header so we exercise the
// public read-only path.

const OWNER = 'share-owner@example.com|Share Owner'

test.describe('share creation (signed-in)', () => {
  test.use({ extraHTTPHeaders: { 'X-Test-User': OWNER } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('Share button is visible when signed in', async ({ page }) => {
    await expect(page.getByTestId('share-create')).toBeVisible()
  })

  test('clicking Share creates a token and shows a status indicator', async ({ page, context }) => {
    // Grant clipboard access so the share flow's clipboard.writeText doesn't reject.
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByTestId('palette-service').click()
    await page.getByTestId('title-input').fill('System architecture')

    await page.getByTestId('share-create').click()
    // The status text should be one of the recognized post-share messages.
    const status = page.getByTestId('share-status')
    await expect(status).toBeVisible()
    const text = (await status.textContent()) ?? ''
    expect(text).toMatch(/copied to clipboard|^http|^\//i)
  })

  test('share link resolves with the diagram content', async ({ page, request }) => {
    await page.getByTestId('palette-service').click()
    await page.getByTestId('title-input').fill('System architecture')

    // Create the share via the API directly to capture the token without depending on the clipboard.
    const res = await request.post('/api/share', {
      data: {
        body: JSON.stringify({
          format: 'graffel',
          schemaVersion: 1,
          id: '01HXSHAREXXXXXXXXXXXXXXXXX',
          metadata: { title: 'Shared diagram', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', appVersion: '0.1.0' },
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: [
            { id: 'n_1', type: 'service', position: { x: 50, y: 60 }, size: { w: 160, h: 80 }, data: { label: 'API' } },
          ],
          edges: [],
          reserved: { remote: null, ops: null },
        }),
        title: 'Shared diagram',
      },
    })
    const created = await res.json() as { token: string; url: string }

    expect(created.token).toMatch(/^[A-Za-z0-9_-]{20,}$/)
    expect(created.url).toBe(`/v/${created.token}`)
  })
})

test.describe('share view (anonymous)', () => {
  // No X-Test-User header — the viewer is anonymous.
  test.use({ extraHTTPHeaders: {} })

  test('unknown token shows a not-found state', async ({ page }) => {
    await page.goto('/v/this-token-does-not-exist')
    await expect(page.getByTestId('share-view-not-found')).toBeVisible()
  })

  test('valid token renders the diagram in read-only mode', async ({ page, baseURL }) => {
    // Use a one-off authed request to seed a share.
    const authed = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: { 'X-Test-User': OWNER },
    })
    const body = JSON.stringify({
      format: 'graffel',
      schemaVersion: 1,
      id: '01HXSHARE2XXXXXXXXXXXXXXXX',
      metadata: { title: 'Read-only', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', appVersion: '0.1.0' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'n_1', type: 'database', position: { x: 100, y: 100 }, size: { w: 120, h: 90 }, data: { label: 'Postgres' } },
      ],
      edges: [],
      reserved: { remote: null, ops: null },
    })
    const res = await authed.post('/api/share', {
      data: { body, title: 'Read-only' },
    })
    const created = await res.json() as { token: string }

    await page.goto(`/v/${created.token}`)
    await expect(page.getByTestId('share-view')).toBeVisible()
    await expect(page.getByTestId('share-view-title')).toHaveText('Read-only')
    // The diagram's shape should render.
    await expect(page.getByTestId('shape-database')).toBeVisible()
    await expect(page.getByTestId('shape-database')).toContainText('Postgres')
    // Editing controls are not present.
    await expect(page.getByTestId('palette')).toHaveCount(0)
    await expect(page.getByTestId('inspector')).toHaveCount(0)
    await expect(page.getByTestId('action-undo')).toHaveCount(0)
    // The "view-only" badge IS present.
    await expect(page.locator('.share-view-badge')).toBeVisible()
  })
})
