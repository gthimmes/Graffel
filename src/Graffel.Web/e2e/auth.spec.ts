import { expect, test } from '@playwright/test'

// v2.0 Auth flows. Real Google OAuth requires out-of-band credentials; tests
// use the TestAuthHandler instead via the X-Test-User header.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('anonymous: Sign in button is shown, user chip is not', async ({ page }) => {
  await expect(page.getByTestId('auth-signin')).toBeVisible()
  await expect(page.getByTestId('auth-user-chip')).toHaveCount(0)
})

test('anonymous: clicking /api/auth/google/start with no creds returns 503', async ({ request }) => {
  // Backend should refuse to issue a challenge when ClientId/Secret aren't configured.
  const res = await request.get('/api/auth/google/start', { maxRedirects: 0 })
  expect(res.status()).toBe(503)
  const body = await res.json()
  expect(body.error).toBe('google_not_configured')
})

test.describe('signed-in via X-Test-User', () => {
  test.use({ extraHTTPHeaders: { 'X-Test-User': 'alice@example.com|Alice Test' } })

  test('user chip shows on load; sign-in button hidden', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('auth-user-chip')).toBeVisible()
    await expect(page.getByTestId('auth-user-name')).toHaveText('Alice Test')
    await expect(page.getByTestId('auth-signin')).toHaveCount(0)
  })

  test('/api/me returns the test user', async ({ request }) => {
    const res = await request.get('/api/me')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.email).toBe('alice@example.com')
    expect(body.name).toBe('Alice Test')
    expect(body.id).toBe('test:alice@example.com')
  })

  test('sign out clears the chip locally', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('auth-user-chip')).toBeVisible()
    await page.getByTestId('auth-signout').click()
    // The test header still triggers the test handler on subsequent requests,
    // so the chip will reappear after a refresh. But the local sign-out call
    // clears state for the current session — verify the chip went away.
    await expect(page.getByTestId('auth-user-chip')).toHaveCount(0)
    await expect(page.getByTestId('auth-signin')).toBeVisible()
  })
})
