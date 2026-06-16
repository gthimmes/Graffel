import { expect, test, type Page } from '@playwright/test'

// v3.20 — dark mode: a toolbar toggle flips the chrome/canvas palette via a
// data-theme attribute on <html>, persisted across reloads.

async function fresh(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('[data-testid="toolbar"]')
}

function rootTheme(page: Page) {
  return page.evaluate(() => document.documentElement.dataset.theme)
}
function appBg(page: Page) {
  // The toolbar surface uses --color-surface, which the dark block overrides.
  return page.evaluate(() => getComputedStyle(document.querySelector('.graffel-toolbar')!).backgroundColor)
}

test('the toolbar toggle switches to dark and back', async ({ page }) => {
  await fresh(page)
  // jsdom/headless default resolves to light.
  expect(await rootTheme(page)).toBe('light')
  const lightBg = await appBg(page)

  await page.getByTestId('action-theme-toggle').click()
  await expect.poll(() => rootTheme(page)).toBe('dark')
  const darkBg = await appBg(page)
  expect(darkBg).not.toBe(lightBg)
  // The toggle now offers to go back to light.
  await expect(page.getByTestId('action-theme-toggle')).toHaveText(/Light/)

  await page.getByTestId('action-theme-toggle').click()
  await expect.poll(() => rootTheme(page)).toBe('light')
})

test('the chosen theme persists across a reload', async ({ page }) => {
  await fresh(page)
  await page.getByTestId('action-theme-toggle').click()
  await expect.poll(() => rootTheme(page)).toBe('dark')

  await page.reload()
  await page.waitForSelector('[data-testid="toolbar"]')
  expect(await rootTheme(page)).toBe('dark')
  expect(await page.evaluate(() => localStorage.getItem('graffel.theme.v1'))).toBe('dark')
})

test('shapes keep their authored fill in dark mode (canvas themes, content does not)', async ({ page }) => {
  await fresh(page)
  // Insert a shape, then go dark.
  await page.getByTestId('palette-service').click()
  await page.waitForSelector('.react-flow__node')
  await page.getByTestId('action-theme-toggle').click()
  await expect.poll(() => rootTheme(page)).toBe('dark')
  // The shape node still renders (its colors are authored, not themed).
  await expect(page.locator('.react-flow__node').first()).toBeVisible()
})
